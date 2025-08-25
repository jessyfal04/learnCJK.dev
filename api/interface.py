from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Form:
    char: str
    same_as_input: bool


@dataclass
class Composition:
    decomposition: List[str]
    jp_supercompositions: List[str]
    zh_supercompositions: List[str]
    merged_supercompositions: List[str]


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
    md: Optional[str] = None


__all__ = ["Form", "Composition", "CharacterInfo"]