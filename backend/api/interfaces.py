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
        }


__all__ = ["Form", "Composition", "CharacterInfo"]
