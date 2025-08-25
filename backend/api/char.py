from typing import Optional, List
from cjkradlib import RadicalFinder
import opencc
from .interfaces import CharacterInfo, Form, Composition
import os


# Load Unihan kDefinition TSV into module-level cache on import
_kdef_cache = {}
try:
	base = os.path.dirname(__file__)
	kdef_path = os.path.normpath(os.path.join(base, os.pardir, "data", "kDefinition.tsv"))
	with open(kdef_path, "r", encoding="utf-8") as fh:
		for line in fh:
			parts = line.rstrip("\n").split("\t")
			if len(parts) >= 4:
				# parts: codepoint, char, key, definition
				_, ch, _, definition = parts[0], parts[1], parts[2], parts[3]
				_kdef_cache[ch] = definition
except FileNotFoundError:
	# file missing is acceptable; leave cache empty
	_kdef_cache = {}
except Exception:
	# any parse/read error -> keep cache empty
	_kdef_cache = {}


def _load_converter(name: str) -> Optional[opencc.OpenCC]:
	"""Try to load an OpenCC converter by config name, return None if not available."""
	try:
		return opencc.OpenCC(name)
	except Exception:
		return None


def _safe_convert(conv: Optional[opencc.OpenCC], text: str) -> str:
	"""Convert text using conv if available, otherwise return text unchanged."""
	if conv is None:
		return text
	try:
		return conv.convert(text)
	except Exception:
		return text


def _same(a: str, b: str) -> bool:
	"""Return True if two strings are identical (and non-empty)."""
	return isinstance(a, str) and isinstance(b, str) and a == b and len(a) > 0


def get_info(char: str, input_lang: str = "auto", output_format: Optional[str] = None) -> CharacterInfo:
	"""
	Get character info for a single CJK character and return a CharacterInfo instance.
	"""

	if not isinstance(char, str) or len(char) == 0:
		raise ValueError("char must be a non-empty string")

	# Load converters if available
	converter_s2t = _load_converter("s2t.json")  # Simplified -> Traditional
	converter_t2s = _load_converter("t2s.json")  # Traditional -> Simplified
	converter_t2jp = _load_converter("t2jp.json")  # Traditional -> Japanese
	# try common jp->t names if available
	converter_jp2t = _load_converter("jp2t.json") or _load_converter("j2t.json")

	# RadicalFinder lookups (JP and ZH)
	finderJP = RadicalFinder(lang="jp")
	finderZH = RadicalFinder(lang="zh")
	resultJP = finderJP.search(char)
	resultZH = finderZH.search(char)

	# Merge composition-related sets from both finders
	compositions = set(resultJP.compositions) | set(resultZH.compositions)
	supercompositions = set(resultJP.supercompositions) | set(resultZH.supercompositions)
	variants = set(resultJP.variants) | set(resultZH.variants)

	# Attempt to detect input language when requested
	detected = input_lang
	# Precompute some conversions for detection
	s2t_char = _safe_convert(converter_s2t, char)
	t2s_char = _safe_convert(converter_t2s, char)

	# Helper to check if this char could be produced by converting a traditional char via t2jp
	def _is_japanese_candidate(candidate_trad: str) -> bool:
		if converter_t2jp is None:
			return False
		try:
			return _safe_convert(converter_t2jp, candidate_trad) == char
		except Exception:
			return False

	# Auto-detection logic
	if input_lang == "auto":
		# If converting char as simplified changes it, it's likely simplified
		if s2t_char != char:
			detected = "sc"
		# Else if converting char as traditional to simplified changes it, it's TC
		elif t2s_char != char:
			detected = "tc"
		# Else try to see if char matches t2jp(candidate_trad) for a small set of candidates
		else:
			candidates = {s2t_char, t2s_char, char}
			if any(_is_japanese_candidate(c) for c in candidates):
				detected = "jp"
			else:
				detected = "unknown"

	# Normalize detected to a known set
	if detected not in {"sc", "tc", "jp"}:
		# fall back to trying to compute all forms; prefer TC if converters exist
		if converter_t2s is not None:
			detected = "tc"
		elif converter_s2t is not None:
			detected = "sc"
		else:
			detected = "jp"

	# Compute canonical forms based on detected input
	simplified = traditional = japanese = None

	if detected == "sc":
		simplified = char
		traditional = _safe_convert(converter_s2t, simplified)
		japanese = _safe_convert(converter_t2jp, traditional)

	elif detected == "tc":
		traditional = char
		simplified = _safe_convert(converter_t2s, traditional)
		japanese = _safe_convert(converter_t2jp, traditional)

	else:  # detected == 'jp'
		japanese = char
		# prefer explicit jp->t converter if available
		if converter_jp2t is not None:
			traditional = _safe_convert(converter_jp2t, japanese)
		else:
			# try to find a traditional candidate that maps to this japanese using t2jp
			found = None
			if converter_t2jp is not None:
				# check some likely candidates: original char, s2t(char), t2s(char)
				for cand in {char, s2t_char, t2s_char}:
					if _safe_convert(converter_t2jp, cand) == japanese:
						found = cand
						break
				traditional = found if found is not None else s2t_char
		# from traditional compute simplified
		simplified = _safe_convert(converter_t2s, traditional)

	# Ensure no None values remain: fallback to char as best-effort
	simplified = simplified or char
	traditional = traditional or char
	japanese = japanese or char

	# Clean up variants (remove exact script forms)
	variants.discard(japanese)
	variants.discard(simplified)
	variants.discard(traditional)

	# Build structured Form/Composition/CharacterInfo objects
	j_form = Form(char=japanese, same_as_input=_same(japanese, char))
	s_form = Form(char=simplified, same_as_input=_same(simplified, char))
	t_form = Form(char=traditional, same_as_input=_same(traditional, char))

	comp = Composition(
		decomposition=sorted(compositions),
		merged_supercompositions=sorted(supercompositions),
	)

	unihan_def = _kdef_cache.get(char)

	ci = CharacterInfo(
		char=char,
		detected_input_lang=detected,
		japanese=j_form,
		simplified=s_form,
		traditional=t_form,
		composition=comp,
		variants=sorted(variants),
		unihan_definition=unihan_def,
	)

	# Note: markdown rendering removed per interfaces change

	return ci


if __name__ == "__main__":
	# Example usage: change the character and the input_lang to test different cases
	ci = get_info("価", input_lang="auto")
	print(ci.to_dict())
