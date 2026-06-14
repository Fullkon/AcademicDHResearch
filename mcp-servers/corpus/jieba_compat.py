"""
jieba 兼容性辅助模块
兼容不同 jieba 版本的 API 差异
"""

import jieba


def lcut(text: str) -> list[str]:
    """兼容不同 jieba 版本的 lcut"""
    try:
        return jieba.lcut(text)
    except AttributeError:
        return list(jieba.cut(text))


def lcut_for_search(text: str) -> list[str]:
    """兼容不同 jieba 版本的 lcut_for_search"""
    try:
        return jieba.lcut_for_search(text)
    except AttributeError:
        return list(jieba.cut_for_search(text))


def posseg_lcut(text: str) -> list[tuple[str, str]]:
    """兼容不同 jieba 版本的 posseg.lcut"""
    import jieba.posseg as pseg
    try:
        return pseg.lcut(text)
    except AttributeError:
        return list(pseg.cut(text))
