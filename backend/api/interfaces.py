from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Form:
    char: str
    same_as_input: bool

    def to_dict(self) -> dict:
        return {"char": self.char, "same_as_input": self.same_as_input}


@dataclass
class Composition:
    decomposition: List[str]
    merged_supercompositions: List[str]

    def to_dict(self) -> dict:
        return {
            "decomposition": self.decomposition,
            "merged_supercompositions": self.merged_supercompositions,
        }


@dataclass
class CJKLearn:
    keyword_rtk: Optional[str]
    keyword_rth: Optional[str]
    keyword_rsh: Optional[str]
    index_hanja: Optional[str]
    index_rtk: Optional[str]
    index_rth: Optional[str]
    index_rsh: Optional[str]

    def to_dict(self) -> dict:
        return {
            "keyword_rtk": self.keyword_rtk,
            "keyword_rth": self.keyword_rth,
            "keyword_rsh": self.keyword_rsh,
            "index_hanja": self.index_hanja,
            "index_rtk": self.index_rtk,
            "index_rth": self.index_rth,
            "index_rsh": self.index_rsh,
        }


@dataclass
class CharacterInfo:
    """Structured return type for character lookup results."""
    char: str
    detected_input_lang: str
    japanese: Form
    simplified: Form
    traditional: Form
    composition: Composition
    variants: List[str]
    unihan_definition: Optional[str]
    cjk_learn: Optional[CJKLearn]

    def to_dict(self) -> dict:
        return {
            "char": self.char,
            "detected_input_lang": self.detected_input_lang,
            "japanese": self.japanese.to_dict(),
            "simplified": self.simplified.to_dict(),
            "traditional": self.traditional.to_dict(),
            "composition": self.composition.to_dict(),
            "variants": self.variants,
            "unihan_definition": self.unihan_definition,
            "cjk_learn": self.cjk_learn,
        }


__all__ = ["Form", "Composition", "CharacterInfo", "CJKLearn"]
