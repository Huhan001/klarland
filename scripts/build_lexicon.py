#!/usr/bin/env python3
"""Generate the shared German-to-English word lexicon used by general cards.

This is a development-time helper. It uses an installed Argos Translate
German-to-English model; the Next.js app only ships the resulting static JSON.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from argostranslate import translate


WORD_PATTERN = re.compile(r"[A-Za-zÄÖÜäöüß0-9]+")

LEXICON_OVERRIDES = {
    "ab": "from",
    "als": "as / than",
    "am": "at the",
    "an": "at / on",
    "auf": "on / to",
    "aus": "from / out of",
    "bei": "at / with",
    "bis": "until",
    "da": "there / because",
    "das": "the / that",
    "dass": "that",
    "dem": "the",
    "den": "the",
    "der": "the",
    "des": "the / of the",
    "die": "the",
    "diese": "this / these",
    "dieser": "this",
    "dürfen": "may / are allowed to",
    "ein": "a / an",
    "eine": "a / an",
    "einem": "a / an",
    "einen": "a / an",
    "einer": "a / an",
    "eines": "a / an",
    "er": "he",
    "es": "it",
    "für": "for",
    "hat": "has",
    "haben": "have",
    "hier": "here",
    "ich": "I",
    "im": "in the",
    "in": "in",
    "ist": "is",
    "jede": "every",
    "jeder": "every / everyone",
    "kann": "can",
    "keine": "no / not any",
    "können": "can",
    "man": "one / people",
    "mit": "with",
    "muss": "must",
    "müssen": "must",
    "nach": "after / according to",
    "nicht": "not",
    "oder": "or",
    "sie": "she / they / you",
    "sind": "are",
    "sich": "oneself",
    "über": "about / over",
    "und": "and",
    "vom": "from the",
    "von": "from / of",
    "war": "was",
    "was": "what",
    "weil": "because",
    "welche": "which",
    "welcher": "which",
    "welches": "which",
    "wenn": "if / when",
    "wer": "who",
    "werden": "become / are",
    "wie": "how",
    "wird": "becomes / is",
    "wo": "where",
    "zu": "to",
    "zum": "to the",
    "zur": "to the",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("catalogue", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    questions = json.loads(args.catalogue.read_text(encoding="utf-8"))
    words = sorted(
        {
            word.casefold()
            for question in questions
            for word in WORD_PATTERN.findall(
                f"{question['question']} {question['answer']}"
            )
        }
    )

    lexicon: dict[str, str] = {}
    batch_size = 80
    for start in range(0, len(words), batch_size):
        batch = words[start : start + batch_size]
        translated = translate.translate("\n".join(batch), "de", "en").splitlines()
        if len(translated) != len(batch):
            translated = [translate.translate(word, "de", "en") for word in batch]

        for german, english in zip(batch, translated, strict=True):
            english = english.strip().removesuffix(":")
            lexicon[german] = english or german

    lexicon.update(LEXICON_OVERRIDES)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(lexicon, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Built {len(lexicon)} shared vocabulary entries.")


if __name__ == "__main__":
    main()
