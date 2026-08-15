#!/usr/bin/env python3
"""filter-review-diff.py の単体テスト。

実行方法（依存なし・標準ライブラリのみ）:
    python3 .github/scripts/test_filter_review_diff.py

CI には組み込んでいない。フィルタを触るときに手元で回すこと。
ワークフローから呼ばれるのは filter-review-diff.py のみで、
このファイルが無くても動作には影響しない。
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    'filter_review_diff', os.path.join(HERE, 'filter-review-diff.py'))
f = importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)

_results = {'ok': 0, 'fail': 0}


def check(label, got, want):
    if got == want:
        _results['ok'] += 1
        print('  OK   %s' % label)
    else:
        _results['fail'] += 1
        print('  FAIL %s\n       got : %r\n       want: %r' % (label, got, want))


def test_extract_path():
    print('=== extract_path ===')
    check('通常のパス', f.extract_path(
        'diff --git a/src/app.ts b/src/app.ts\n'
        'index 111..222 100644\n--- a/src/app.ts\n+++ b/src/app.ts\n@@ -1 +1 @@\n-a\n+b\n'),
        'src/app.ts')

    # ヘッダ行だけを正規表現で切ると " b/" の最初の出現で誤分割する。
    # +++ 行を優先して見ることで防いでいる（PR #196 のレビュー指摘）。
    check('パスに " b/" を含む', f.extract_path(
        'diff --git a/src/some b/file.ts b/src/some b/file.ts\n'
        'index 111..222 100644\n--- a/src/some b/file.ts\n+++ b/src/some b/file.ts\n@@ -1 +1 @@\n-a\n+b\n'),
        'src/some b/file.ts')

    # モード変更のみの場合は ---/+++ が無いのでヘッダ行から推定する
    check('空白入りパス・ヘッダのみ', f.extract_path(
        'diff --git a/my dir/my file.txt b/my dir/my file.txt\n'
        'old mode 100644\nnew mode 100755\n'),
        'my dir/my file.txt')

    check('新規追加（--- が /dev/null）', f.extract_path(
        'diff --git a/new.ts b/new.ts\nnew file mode 100644\n'
        '--- /dev/null\n+++ b/new.ts\n@@ -0,0 +1 @@\n+x\n'),
        'new.ts')
    check('削除（+++ が /dev/null）', f.extract_path(
        'diff --git a/old.ts b/old.ts\ndeleted file mode 100644\n'
        '--- a/old.ts\n+++ /dev/null\n@@ -1 +0,0 @@\n-x\n'),
        'old.ts')
    # `rename to` 行を明示的に読む（ヘッダ行の正規表現任せにしない）
    check('リネーム（内容変更なし）', f.extract_path(
        'diff --git a/a.ts b/b.ts\nsimilarity index 100%\nrename from a.ts\nrename to b.ts\n'),
        'b.ts')
    check('リネーム（パスに空白あり）', f.extract_path(
        'diff --git a/old dir/a.ts b/new dir/b.ts\nsimilarity index 95%\n'
        'rename from old dir/a.ts\nrename to new dir/b.ts\n'),
        'new dir/b.ts')
    check('リネーム＋内容変更（+++ を優先）', f.extract_path(
        'diff --git a/a.ts b/b.ts\nsimilarity index 90%\nrename from a.ts\nrename to b.ts\n'
        '--- a/a.ts\n+++ b/b.ts\n@@ -1 +1 @@\n-x\n+y\n'),
        'b.ts')

    # 本文に +++ / --- で始まる行があってもヘッダと取り違えない（@@ で走査を止める）
    check('本文の +++ を拾わない', f.extract_path(
        'diff --git a/doc.md b/doc.md\n--- a/doc.md\n+++ b/doc.md\n'
        '@@ -1 +1 @@\n-+++ b/fake.ts\n++++ b/other.ts\n'),
        'doc.md')


def test_is_noise():
    print('=== is_noise ===')
    for path, want in [
        ('cooking-cost-system/package-lock.json', True),
        ('frontend/yarn.lock', True),
        ('go.sum', True),
        ('a/b/Cargo.lock', True),
        ('src/vendor.min.js', True),
        ('dist/app.js.map', True),
        ('dist/styles.css.map', True),
        # .map 単体では除外しない（独自形式の *.map を誤除外しないため）
        ('data/world.map', False),
        ('config/routes.map', False),
        # .snap は除外しない（UIの変化を検出する目的でレビューしたいことがある）
        ('src/__snapshots__/App.test.tsx.snap', False),
        ('src/app.ts', False),
        ('src/locked.ts', False),
        ('src/package-lock.json.bak', False),
    ]:
        check('is_noise(%s)' % path, f.is_noise(path), want)


def test_split_blocks():
    print('=== split_blocks ===')
    two = ('diff --git a/x.ts b/x.ts\n--- a/x.ts\n+++ b/x.ts\n@@ -1 +1 @@\n-a\n+b\n'
           'diff --git a/y.ts b/y.ts\n--- a/y.ts\n+++ b/y.ts\n@@ -1 +1 @@\n-c\n+d\n')
    check('2ファイルに分割', len(f.split_blocks(two)), 2)
    check('本文中の "diff --git" 風の行で誤分割しない', len(f.split_blocks(
        'diff --git a/z.md b/z.md\n--- a/z.md\n+++ b/z.md\n'
        '@@ -1 +1 @@\n-x\n+ diff --git a/fake b/fake\n')), 1)


def test_count_changes():
    print('=== count_changes ===')
    check('追加3・削除2', f.count_changes(
        'diff --git a/x.ts b/x.ts\n--- a/x.ts\n+++ b/x.ts\n'
        '@@ -1,2 +1,3 @@\n-a\n-b\n+c\n+d\n+e\n'), (3, 2))


def main():
    test_extract_path()
    test_is_noise()
    test_split_blocks()
    test_count_changes()
    print()
    print('OK=%d FAIL=%d' % (_results['ok'], _results['fail']))
    return 1 if _results['fail'] else 0


if __name__ == '__main__':
    sys.exit(main())
