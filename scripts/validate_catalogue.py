#!/usr/bin/env python3
"""Build the 300-card general catalogue from the current BAMF PDF.

The German question and answer text in the generated file always comes from the
official PDF. An imported bilingual dataset supplies English translations. A
separately maintained question bank is used only when an older imported answer
no longer matches an official answer option.
"""

from __future__ import annotations

import argparse
import json
import re
import struct
import sys
import unicodedata
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

import pdfplumber
from lxml import html


IMAGE_QUESTIONS = {21, 55, 70, 130, 176, 181, 187, 209, 216, 226, 235}


def compact(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("…", "...").replace("’", "'")
    return re.sub(r"\s+", " ", value).strip()


def comparable(value: str) -> str:
    value = compact(value).casefold().replace("bild ", "")
    value = re.sub(r"[^\wäöüß]+", " ", value, flags=re.UNICODE)
    return re.sub(r"\s+", " ", value).strip()


def similarity(left: str, right: str) -> float:
    """Compare wording while tolerating reordered inclusive-language pairs."""
    left_key = comparable(left)
    right_key = comparable(right)
    left_words = Counter(left_key.split())
    right_words = Counter(right_key.split())
    shared = sum((left_words & right_words).values())
    total = max(sum(left_words.values()) + sum(right_words.values()), 1)
    sorted_left = " ".join(sorted(left_words.elements()))
    sorted_right = " ".join(sorted(right_words.elements()))

    return max(
        SequenceMatcher(None, left_key, right_key).ratio(),
        SequenceMatcher(None, sorted_left, sorted_right).ratio(),
        (2 * shared) / total,
    )


def load_imported(path: Path) -> dict[int, dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    questions = payload.get("content", payload).get("questions", [])
    return {int(question["id"]): question for question in questions}


def clean_pdf_text(value: str) -> str:
    value = re.sub(r"Seite \d+ von \d+.*", "", value, flags=re.DOTALL)
    return compact(value)


def load_official_pdf(path: Path) -> dict[int, dict[str, Any]]:
    with pdfplumber.open(path) as document:
        text = "\n".join(
            page.extract_text(x_tolerance=2, y_tolerance=3) or ""
            for page in document.pages
        )

    text = re.split(r"Teil II\s+Fragen für das Bundesland", text, maxsplit=1)[0]
    questions: dict[int, dict[str, Any]] = {}

    for number in range(1, 301):
        next_marker = rf"Aufgabe {number + 1}\n" if number < 300 else r"\Z"
        match = re.search(
            rf"Aufgabe {number}\n(.*?)(?={next_marker})",
            text,
            flags=re.DOTALL,
        )
        if not match:
            raise ValueError(f"Official PDF is missing Aufgabe {number}")

        parts = re.split(r"[□]", match.group(1))
        if len(parts) != 5:
            raise ValueError(
                f"Expected four answer options for Aufgabe {number}, got {len(parts) - 1}"
            )

        question = re.sub(r"^\d+\.\s*", "", parts[0].strip())
        question = re.sub(
            r"(?m)^Bild 1 Bild 2 Bild 3 Bild 4\s*$", "", question
        )
        question = re.sub(r"(?m)^(?:©|In Anlehnung).*$", "", question)
        question = clean_pdf_text(question)
        options = [clean_pdf_text(option) for option in parts[1:]]
        questions[number] = {"question": question, "options": options}

    return questions


def load_reference(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def match_reference(
    question: str,
    options: list[str],
    reference: list[dict[str, Any]],
) -> dict[str, Any]:
    best_score = -1.0
    best_item: dict[str, Any] | None = None

    for item in reference:
        question_score = similarity(question, item["question"])
        if question_score < 0.55:
            continue

        reference_options = [item[key] for key in "abcd"]
        option_score = sum(
            max(similarity(option, candidate) for candidate in reference_options)
            for option in options
        ) / 4
        score = (question_score * 0.72) + (option_score * 0.28)

        if score > best_score:
            best_score = score
            best_item = item

    if best_item is None or best_score < 0.68:
        raise ValueError(f"No reliable answer reference for: {question}")

    return best_item


def load_secondary_answers(path: Path | None) -> dict[int, str]:
    if path is None:
        return {}

    document = html.fromstring(path.read_bytes())
    answer_links = document.xpath("//a[starts-with(@href, '/fragen/')][.//h3]")
    answers: dict[int, str] = {}

    for link in answer_links:
        number = int(link.get("href", "").rsplit("/", 1)[-1])
        if number > 300 or number in answers:
            continue
        answer = compact(" ".join(link.xpath(".//p//text()")))
        answers[number] = re.sub(r"^✓\s*", "", answer)

    return answers


def png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Expected a PNG image: {path}")
    return struct.unpack(">II", data[16:24])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("imported_json", type=Path)
    parser.add_argument("official_pdf", type=Path)
    parser.add_argument("reference_json", type=Path)
    parser.add_argument("--secondary-html", type=Path)
    parser.add_argument("--image-dir", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    imported = load_imported(args.imported_json)
    official = load_official_pdf(args.official_pdf)
    reference = load_reference(args.reference_json)
    secondary = load_secondary_answers(args.secondary_html)

    if len(imported) != 300 or len(official) != 300:
        print(
            f"Catalogue count error: imported={len(imported)}, official={len(official)}"
        )
        return 1

    generated: list[dict[str, Any]] = []
    updated_answers: list[tuple[int, str, str]] = []
    secondary_disagreements: list[tuple[int, str, str]] = []

    for number in range(1, 301):
        source = imported[number]
        official_question = official[number]["question"]
        official_options = official[number]["options"]
        imported_answer = source["correct_answer"]["de"]
        imported_scores = [
            similarity(imported_answer, option) for option in official_options
        ]
        imported_match = max(imported_scores)
        answer_english = source["correct_answer"]["en"]

        if imported_match >= 0.95:
            answer = official_options[imported_scores.index(imported_match)]
        else:
            answer_reference = match_reference(
                official_question, official_options, reference
            )
            solution = answer_reference["solution"]
            reference_answer = answer_reference[solution]
            reference_scores = [
                similarity(reference_answer, option) for option in official_options
            ]
            reference_match = max(reference_scores)
            if reference_match < 0.95:
                raise ValueError(
                    f"Could not resolve current answer for Aufgabe {number}: "
                    f"{reference_answer!r}"
                )
            answer = official_options[reference_scores.index(reference_match)]
            answer_english = answer_reference["translation"]["en"][solution]
            updated_answers.append((number, imported_answer, answer))

        if number in secondary and similarity(answer, secondary[number]) < 0.78:
            secondary_disagreements.append((number, answer, secondary[number]))

        question_data: dict[str, Any] = {
            "id": f"de-{number:03d}",
            "number": number,
            "question": official_question,
            "answer": answer,
            "questionEnglish": source["question"]["en"],
            "answerEnglish": answer_english,
        }
        if number in IMAGE_QUESTIONS:
            image_name = source.get("image")
            if not image_name:
                raise ValueError(f"Missing illustration filename for Aufgabe {number}")
            width, height = (1200, 800)
            if args.image_dir:
                width, height = png_dimensions(args.image_dir / image_name)
            question_data["questionImage"] = {
                "src": f"/images/general/{image_name}",
                "alt": f"Offizielle Abbildung zu Frage {number}",
                "width": width,
                "height": height,
            }
        generated.append(question_data)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(generated, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Built {len(generated)} general questions from the official BAMF PDF.")
    print(f"Current-answer updates applied: {len(updated_answers)}")
    for number, old, new in updated_answers:
        print(f"  Aufgabe {number}: {old} -> {new}")
    if secondary:
        print(f"Secondary-source disagreements (informational): {len(secondary_disagreements)}")
        for number, final, secondary_answer in secondary_disagreements:
            print(f"  Aufgabe {number}: final={final!r}; secondary={secondary_answer!r}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
