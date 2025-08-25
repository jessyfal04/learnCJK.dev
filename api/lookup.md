# How to name a CJK character
- Input character: [INPUT]

## Forms
- JP form: [JP_CHAR] — same as input? [YES/NO]
- SC form: [SC_CHAR] — same as input? [YES/NO]
- TC form: [TC_CHAR] — same as input? [YES/NO]

(Each form entry should include the character and whether it is identical to the provided input character.)

## Composition
- Decomposition: [DECOMPOSITION]
- JP supercompositions: [JP_SUPERCOMPOSITIONS]
- ZH supercompositions: [ZH_SUPERCOMPOSITIONS]
- Merged supercompositions: [MERGED_SUPERCOMPOSITIONS]

(Decomposition is the immediate components used to build the glyph. Supercompositions are larger characters that contain the input as a component.)

## Variants
- Other variants (excluding the JP/SC/TC canonical forms): [VARIANTS]

---

Notes for `get_info` in `lookup.py`:
- The Python function should return a dict with the keys: `char`, `detected_input_lang`, `forms`, `composition`, `variants`.
- `forms` should be an object with `japanese`, `simplified`, `traditional` each containing `char` and `same_as_input` (boolean).
- `composition` should contain `decomposition`, `jp_supercompositions`, `zh_supercompositions`, and `merged_supercompositions`.
- `variants` should be a list excluding any of the three canonical forms.

The script should also be able to render the above markdown report from those fields (e.g. via an `output_format='md'` argument to `get_info`).


