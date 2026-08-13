import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const general = JSON.parse(
  readFileSync(resolve(root, "src/data/general-questions.json"), "utf8"),
);
const hessenSource = readFileSync(
  resolve(root, "src/data/hessen-questions.ts"),
  "utf8",
);
const hessenIds = [...hessenSource.matchAll(/id: "(he-\d{2})"/g)].map(
  (match) => match[1],
);

if (general.length !== 300) {
  throw new Error(`Expected 300 general questions, found ${general.length}`);
}

for (const [index, question] of general.entries()) {
  const number = index + 1;
  if (
    question.number !== number ||
    question.id !== `de-${String(number).padStart(3, "0")}` ||
    !question.question ||
    !question.answer ||
    !question.questionEnglish ||
    !question.answerEnglish
  ) {
    throw new Error(`Invalid general question at position ${number}`);
  }

  if (
    question.questionImage &&
    !existsSync(resolve(root, "public", question.questionImage.src.slice(1)))
  ) {
    throw new Error(`Missing image for ${question.id}`);
  }
}

if (hessenIds.length !== 10 || new Set(hessenIds).size !== 10) {
  throw new Error(`Expected 10 unique Hessen questions, found ${hessenIds.length}`);
}

console.log("Catalogue verified: 300 general + 10 Hessen questions.");
