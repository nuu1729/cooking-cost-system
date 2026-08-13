#!/usr/bin/env python3
"""AIレビューに渡す unified diff から機械生成ファイルを除外する。

背景:
    PR #187 では diff 全体が 759,140 文字あり、そのうち package-lock.json
    だけで約90%（追加7,904行 / 削除4,078行）を占めていた。
    claude-review.yml は差分を文字数で打ち切るため、レビューに届いたのは
    全体の13.2%だけで、レビュー対象のソースファイルが丸ごと欠落していた。
    その結果「既に削除済みのコード」への指摘が繰り返し発生した。

    人間がレビューしない機械生成ファイルを先に落とすことで、
    同じ上限でも実際のソース差分が届くようにする。

入出力:
    stdin  : unified diff（git / GitHub の diff 形式）
    stdout : 除外後の diff。末尾に除外したファイルの一覧を注記として付ける
    stderr : 処理サマリ（ワークフローのログ用）
"""
import re
import sys

# 機械生成・巨大バイナリ相当でレビュー価値が低いファイル。
# パスの末尾要素、または拡張子で判定する。
NOISE_BASENAMES = {
    'package-lock.json',
    'npm-shrinkwrap.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'poetry.lock',
    'Pipfile.lock',
    'composer.lock',
    'Gemfile.lock',
    'Cargo.lock',
    'go.sum',
}
NOISE_SUFFIXES = ('.min.js', '.min.css', '.map', '.snap')

# "diff --git a/<path> b/<path>" から新しい側のパスを取る。
# パスに空白を含む場合に備え b/ 以降を貪欲に拾う。
DIFF_HEADER = re.compile(r'^diff --git a/(?:.+?) b/(.+)$')


def is_noise(path):
    basename = path.rsplit('/', 1)[-1]
    if basename in NOISE_BASENAMES:
        return True
    return path.endswith(NOISE_SUFFIXES)


def split_blocks(diff_text):
    """diff をファイル単位のブロックに分割して (path, block) を返す。

    先頭に "diff --git" 以外の行がある場合は path=None のブロックとして保持する。
    """
    blocks = []
    current_path = None
    current_lines = []
    for line in diff_text.splitlines(keepends=True):
        m = DIFF_HEADER.match(line.rstrip('\n'))
        if m:
            if current_lines:
                blocks.append((current_path, ''.join(current_lines)))
            current_path = m.group(1)
            current_lines = [line]
        else:
            current_lines.append(line)
    if current_lines:
        blocks.append((current_path, ''.join(current_lines)))
    return blocks


def count_changes(block):
    added = removed = 0
    for line in block.splitlines():
        if line.startswith('+') and not line.startswith('+++'):
            added += 1
        elif line.startswith('-') and not line.startswith('---'):
            removed += 1
    return added, removed


def main():
    diff_text = sys.stdin.buffer.read().decode('utf-8', 'replace')
    if not diff_text.strip():
        return 0

    kept = []
    excluded = []
    for path, block in split_blocks(diff_text):
        if path is not None and is_noise(path):
            added, removed = count_changes(block)
            excluded.append((path, added, removed))
        else:
            kept.append(block)

    out = ''.join(kept)
    if excluded:
        lines = [
            '',
            '',
            '# 注記: 以下のファイルは機械生成のためレビュー対象から除外しました。',
            '# 依存の増減はソース側の変更から読み取ってください。',
        ]
        for path, added, removed in excluded:
            lines.append('#   %s (+%d / -%d)' % (path, added, removed))
        out += '\n'.join(lines) + '\n'

    # 端末やロケールの既定エンコーディングに依存しないよう、常に UTF-8 のバイトで書く
    # （Windows のローカル検証では cp932 で落ちるため）
    sys.stdout.buffer.write(out.encode('utf-8'))

    log = ['filter-review-diff: %d 文字 -> %d 文字（除外 %d ファイル）'
           % (len(diff_text), len(out), len(excluded))]
    for path, added, removed in excluded:
        log.append('  除外: %s (+%d / -%d)' % (path, added, removed))
    sys.stderr.buffer.write(('\n'.join(log) + '\n').encode('utf-8'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
