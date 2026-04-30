"""
日本語のひらがな・カタカナ変換ユーティリティ

検索時に「とまと」「トマト」のどちらで入力されても
同じ結果が返るよう、変換バリアントを生成する。
"""

# ひらがな範囲: U+3041 (ぁ) 〜 U+3096 (ゖ)
_HIRA_START = ord('\u3041')
_HIRA_END   = ord('\u3096')
# カタカナ範囲: U+30A1 (ァ) 〜 U+30F6 (ヶ)
_KATA_START = ord('\u30A1')
_KATA_END   = ord('\u30F6')
_KANA_OFFSET = 0x60  # ひらがな + 0x60 = カタカナ


def to_katakana(text: str) -> str:
    """ひらがなをカタカナに変換する（それ以外の文字はそのまま）"""
    return ''.join(
        chr(ord(c) + _KANA_OFFSET) if _HIRA_START <= ord(c) <= _HIRA_END else c
        for c in text
    )


def to_hiragana(text: str) -> str:
    """カタカナをひらがなに変換する（それ以外の文字はそのまま）"""
    return ''.join(
        chr(ord(c) - _KANA_OFFSET) if _KATA_START <= ord(c) <= _KATA_END else c
        for c in text
    )


def kana_variants(text: str) -> list:
    """
    入力文字列のひらがな・カタカナ両表記を重複なしで返す。

    例:
      'とまと'  → ['とまと', 'トマト']
      'トマト'  → ['トマト', 'とまと']
      'tomato'  → ['tomato']           # 変換なし
    """
    kata = to_katakana(text)
    hira = to_hiragana(text)
    seen = []
    for v in (text, kata, hira):
        if v not in seen:
            seen.append(v)
    return seen
