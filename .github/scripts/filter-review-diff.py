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

エラー処理:
    例外は握りつぶさず、そのまま伝播させて非ゼロ終了する。
    フィルタが壊れた状態で「差分が空」のままレビューを続けるより、
    ワークフローを止めて気づけるようにする方が安全なため。
    （フィルタのファイル自体が存在しない場合は呼び出し側で
      スキップされる。claude-review.yml のフォールバックを参照。）
"""
import re
import sys

# 機械生成でレビュー価値が低いファイル。パスの末尾要素で判定する。
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

# 拡張子で判定するもの。
#
# `.map` 単体では判定しない。汎用的すぎて独自形式の *.map を誤除外するため、
# 実際の対象である source map（.js.map / .css.map）に限定している。
#
# .snap（Jest スナップショット）は意図的に含めていない。
# スナップショットの差分は UI の変化を検出する目的でレビューしたいことがあり、
# 一律除外すると本来見たい変更まで落ちるため。巨大なスナップショットは
# 文字数上限側で打ち切られ、打ち切りマーカーが出るので気づける。
NOISE_SUFFIXES = ('.min.js', '.min.css', '.js.map', '.css.map')

DIFF_START = 'diff --git '


def is_noise(path):
    basename = path.rsplit('/', 1)[-1]
    if basename in NOISE_BASENAMES:
        return True
    return path.endswith(NOISE_SUFFIXES)


def extract_path(block):
    """ブロックから対象ファイルのパスを取り出す。

    ヘッダ行 `diff --git a/<path> b/<path>` はパスに空白が含まれると
    区切りが曖昧になる（`src/some b/file.ts` のようなパスで誤分割する）。
    そのため、パスが1つしか現れない行を優先して使う。

    優先順位:
      1. `+++ b/<path>`   通常の変更・新規追加
      2. `rename to <path>`   内容変更を伴わないリネーム（+++ が出ない）
      3. `--- a/<path>`   削除（+++ は /dev/null になる）
      4. ヘッダ行からの推定（モード変更のみ等、上のどれも無い場合）
    """
    to_path = None
    from_path = None
    rename_to = None
    for line in block.splitlines():
        if line.startswith('@@'):
            break  # ヘッダ部の終わり。以降は本文なので見ない
        if to_path is None and line.startswith('+++ '):
            value = line[4:]
            if value != '/dev/null':
                to_path = value[2:] if value.startswith('b/') else value
        elif from_path is None and line.startswith('--- '):
            value = line[4:]
            if value != '/dev/null':
                from_path = value[2:] if value.startswith('a/') else value
        elif rename_to is None and line.startswith('rename to '):
            rename_to = line[len('rename to '):]
    if to_path:
        return to_path
    if rename_to:
        return rename_to
    if from_path:
        return from_path

    # フォールバック: ヘッダ行から取る。
    # rename でない限り a/ と b/ のパスは同一なので、
    # 「同じ長さの2つのパスが ' b/' で連結されている」前提で分割できる。
    #
    # 限界: a/ と b/ でパスが異なり、かつ `rename to` も ---/+++ も出ない
    # 差分（実質モード変更のみのリネーム）では、末尾の re.match による
    # 推定に落ちるため誤ったパスを返しうる。
    # ただし is_noise はパスの末尾要素と拡張子で判定するため、
    # この誤りが「除外すべきでないファイルを除外する」方向に働くことは稀。
    header = block.split('\n', 1)[0]
    if not header.startswith(DIFF_START + 'a/'):
        return None
    rest = header[len(DIFF_START):]           # "a/<path> b/<path>"
    n = (len(rest) - 5) // 2                  # len = 2 + n + 3 + n
    if n > 0 and rest[2 + n:5 + n] == ' b/':
        return rest[5 + n:]
    m = re.match(r'^a/(?:.+?) b/(.+)$', rest)  # rename 等はここで妥協する
    return m.group(1) if m else None


def split_blocks(diff_text):
    """diff をファイル単位のブロックに分割する。

    `diff --git ` で始まる行を境界にするだけなので、パスの中身に依存しない。
    先頭に境界行より前の行がある場合は最初のブロックとして保持する。
    """
    blocks = []
    current = []
    for line in diff_text.splitlines(keepends=True):
        if line.startswith(DIFF_START):
            if current:
                blocks.append(''.join(current))
            current = [line]
        else:
            current.append(line)
    if current:
        blocks.append(''.join(current))
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
    for block in split_blocks(diff_text):
        path = extract_path(block)
        # パスが取れないブロック（diff 先頭のメタ情報など）は判定できないので残す
        if path is not None and is_noise(path):
            added, removed = count_changes(block)
            excluded.append((path, added, removed))
        else:
            kept.append(block)

    if excluded:
        note = [
            '',
            '',
            '# 注記: 以下のファイルは機械生成のためレビュー対象から除外しました。',
            '# 依存の増減はソース側の変更から読み取ってください。',
        ]
        for path, added, removed in excluded:
            note.append('#   %s (+%d / -%d)' % (path, added, removed))
        kept.append('\n'.join(note) + '\n')

    out = ''.join(kept)
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
