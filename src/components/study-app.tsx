"use client";

import Image from "next/image";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import generalQuestionData from "@/data/general-questions.json";
import generalLexicon from "@/data/general-lexicon.json";
import {
  hessenQuestions,
  type StudyQuestion,
  type VocabularyItem,
} from "@/data/hessen-questions";

type StudyStatus = "known" | "review";
type StudyMode = "words" | "chunks";
type Collection = "general" | "hessen" | "review";
type SavedPosition = { collection: "general" | "hessen"; index: number };

const generalQuestions = generalQuestionData as StudyQuestion[];
const allQuestions = [...generalQuestions, ...hessenQuestions];
const PROGRESS_STORAGE_KEY = "klarland:progress-v2";
const POSITION_STORAGE_KEY = "klarland:position-v2";
const LEGACY_PROGRESS_STORAGE_KEY = "klarland:hessen-progress";
const LEGACY_POSITION_STORAGE_KEY = "klarland:hessen-position";
const WORD_PATTERN = /[A-Za-zÄÖÜäöüß0-9]+/g;

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className={direction === "left" ? "arrow-left" : undefined}
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 4h10v16l-5-3-5 3V4Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5" />
    </svg>
  );
}

function safeReadProgress(): Record<string, StudyStatus> {
  try {
    const current = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    const legacy = window.localStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY);
    const parsedCurrent = current ? (JSON.parse(current) as Record<string, unknown>) : {};
    const parsedLegacy = legacy ? (JSON.parse(legacy) as Record<string, unknown>) : {};
    const merged = { ...parsedLegacy, ...parsedCurrent };

    return Object.fromEntries(
      Object.entries(merged).filter(
        ([, status]) => status === "known" || status === "review",
      ),
    ) as Record<string, StudyStatus>;
  } catch {
    return {};
  }
}

function safeReadPosition(): SavedPosition {
  try {
    const saved = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<SavedPosition>;
      const limit = parsed.collection === "general" ? 300 : 10;
      if (
        (parsed.collection === "general" || parsed.collection === "hessen") &&
        Number.isInteger(parsed.index) &&
        Number(parsed.index) >= 0 &&
        Number(parsed.index) < limit
      ) {
        return parsed as SavedPosition;
      }
    }

    const legacy = Number(window.localStorage.getItem(LEGACY_POSITION_STORAGE_KEY));
    if (Number.isInteger(legacy) && legacy >= 0 && legacy < 10) {
      return { collection: "hessen", index: legacy };
    }
  } catch {
    // A corrupt local value should never stop the catalogue from opening.
  }

  return { collection: "general", index: 0 };
}

function questionCollection(question: StudyQuestion): "general" | "hessen" {
  return question.id.startsWith("he-") ? "hessen" : "general";
}

function globalQuestionNumber(question: StudyQuestion) {
  return questionCollection(question) === "general"
    ? question.number
    : 300 + question.number;
}

function collectionLabel(collection: Collection) {
  if (collection === "general") return "Allgemein";
  if (collection === "hessen") return "Hessen";
  return "Wiederholen";
}

function buildSentenceChunks(question: StudyQuestion): VocabularyItem[] {
  const pairs = [
    {
      german: question.question,
      english: question.questionEnglish ?? "",
      note: "Frage im Kontext",
    },
    {
      german: question.answer,
      english: question.answerEnglish ?? "",
      note: "Richtige Antwort",
    },
  ];

  return pairs.filter((item) => item.english);
}

function buildWordList(question: StudyQuestion): VocabularyItem[] {
  const surfaceWords =
    `${question.question} ${question.answer}`.match(WORD_PATTERN) ?? [];
  const seen = new Set<string>();

  return surfaceWords.flatMap((word) => {
    const key = word.toLocaleLowerCase("de-DE");
    if (seen.has(key)) return [];
    seen.add(key);

    return [
      {
        german: word,
        english:
          (generalLexicon as Record<string, string>)[key] ?? word,
      },
    ];
  });
}

function vocabularyFor(question: StudyQuestion, mode: StudyMode) {
  if (mode === "words") {
    return question.words ?? buildWordList(question);
  }
  return question.chunks ?? buildSentenceChunks(question);
}

export function StudyApp() {
  const [collection, setCollection] = useState<Collection>("general");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<StudyMode>("chunks");
  const [progress, setProgress] = useState<Record<string, StudyStatus>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const position = safeReadPosition();
      setProgress(safeReadProgress());
      setCollection(position.collection);
      setCurrentIndex(position.index);
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const reviewQuestions = useMemo(
    () => allQuestions.filter((question) => progress[question.id] === "review"),
    [progress],
  );
  const activeQuestions =
    collection === "general"
      ? generalQuestions
      : collection === "hessen"
        ? hessenQuestions
        : reviewQuestions;
  const resolvedIndex = activeQuestions.length
    ? Math.min(currentIndex, activeQuestions.length - 1)
    : 0;
  const currentQuestion = activeQuestions[resolvedIndex];
  const currentStatus = currentQuestion ? progress[currentQuestion.id] : undefined;
  const vocabulary = currentQuestion
    ? vocabularyFor(currentQuestion, mode)
    : [];

  const knownCount = useMemo(
    () => Object.values(progress).filter((status) => status === "known").length,
    [progress],
  );
  const reviewCount = useMemo(
    () => Object.values(progress).filter((status) => status === "review").length,
    [progress],
  );

  const goToQuestion = useCallback(
    (nextCollection: Collection, index: number) => {
      const questions =
        nextCollection === "general"
          ? generalQuestions
          : nextCollection === "hessen"
            ? hessenQuestions
            : reviewQuestions;
      const nextIndex = questions.length
        ? Math.min(Math.max(index, 0), questions.length - 1)
        : 0;

      setCollection(nextCollection);
      setCurrentIndex(nextIndex);
      if (nextCollection !== "review") {
        window.localStorage.setItem(
          POSITION_STORAGE_KEY,
          JSON.stringify({ collection: nextCollection, index: nextIndex }),
        );
      }
    },
    [reviewQuestions],
  );

  const goRelative = useCallback(
    (direction: -1 | 1) => {
      if (collection === "review") {
        goToQuestion("review", resolvedIndex + direction);
        return;
      }

      if (collection === "general") {
        if (direction === 1 && resolvedIndex === generalQuestions.length - 1) {
          goToQuestion("hessen", 0);
          return;
        }
        goToQuestion("general", resolvedIndex + direction);
        return;
      }

      if (direction === -1 && resolvedIndex === 0) {
        goToQuestion("general", generalQuestions.length - 1);
        return;
      }
      goToQuestion("hessen", resolvedIndex + direction);
    },
    [collection, goToQuestion, resolvedIndex],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowLeft") goRelative(-1);
      if (event.key === "ArrowRight") goRelative(1);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goRelative]);

  function updateStatus(status: StudyStatus) {
    if (!currentQuestion) return;

    setProgress((currentProgress) => {
      const nextProgress = { ...currentProgress };
      if (nextProgress[currentQuestion.id] === status) {
        delete nextProgress[currentQuestion.id];
      } else {
        nextProgress[currentQuestion.id] = status;
      }
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress));
      return nextProgress;
    });
  }

  function jumpToQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = Number(form.get("question-number"));
    if (!Number.isInteger(number) || number < 1 || number > 310) return;

    if (number <= 300) goToQuestion("general", number - 1);
    else goToQuestion("hessen", number - 301);
  }

  const rangeStart = Math.floor(resolvedIndex / 10) * 10;
  const visibleQuestions = activeQuestions.slice(rangeStart, rangeStart + 10);
  const currentGlobalNumber = currentQuestion
    ? globalQuestionNumber(currentQuestion)
    : 0;
  const overallPosition =
    collection === "review" ? resolvedIndex + 1 : currentGlobalNumber;
  const overallTotal = collection === "review" ? activeQuestions.length : 310;
  const canGoBack =
    collection === "review"
      ? resolvedIndex > 0
      : currentGlobalNumber > 1;
  const canGoForward =
    collection === "review"
      ? resolvedIndex < activeQuestions.length - 1
      : currentGlobalNumber > 0 && currentGlobalNumber < 310;

  return (
    <div className={`study-shell ${isReady ? "is-ready" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#study" aria-label="Klarland home">
          <span className="brand-mark" aria-hidden="true">K</span>
          <span>
            <strong>Klarland</strong>
            <small>Deutsch verstehen. Deutschland kennen.</small>
          </span>
        </a>

        <div className="collection-switch" aria-label="Fragensammlung" role="group">
          <button
            type="button"
            className={collection === "general" ? "is-active" : ""}
            onClick={() => goToQuestion("general", 0)}
          >
            Allgemein <span>300</span>
          </button>
          <button
            type="button"
            className={collection === "hessen" ? "is-active" : ""}
            onClick={() => goToQuestion("hessen", 0)}
          >
            Hessen <span>10</span>
          </button>
          <button
            type="button"
            className={collection === "review" ? "is-active" : ""}
            onClick={() => goToQuestion("review", 0)}
          >
            Wiederholen <span>{reviewCount}</span>
          </button>
        </div>

        <a
          className="source-link"
          href="https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.html"
          target="_blank"
          rel="noreferrer"
        >
          <SourceIcon />
          BAMF Quelle
        </a>
      </header>

      <div className="progress-line" aria-hidden="true">
        <span
          style={{
            width: `${overallTotal ? (overallPosition / overallTotal) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="workspace" id="study">
        <aside className="question-rail" aria-label={`${collectionLabel(collection)} questions`}>
          <div className="rail-heading">
            <span>{collectionLabel(collection)}</span>
            <small>
              {collection === "general"
                ? "300 Fragen"
                : collection === "hessen"
                  ? "Landesfragen"
                  : `${reviewQuestions.length} markiert`}
            </small>
          </div>

          {activeQuestions.length > 10 && (
            <div className="rail-range" aria-label="Question range">
              <button
                type="button"
                disabled={rangeStart === 0}
                onClick={() => goToQuestion(collection, rangeStart - 10)}
                aria-label="Vorherige zehn Fragen"
              >
                ‹
              </button>
              <span>
                {rangeStart + 1}–{Math.min(rangeStart + 10, activeQuestions.length)}
              </span>
              <button
                type="button"
                disabled={rangeStart + 10 >= activeQuestions.length}
                onClick={() => goToQuestion(collection, rangeStart + 10)}
                aria-label="Nächste zehn Fragen"
              >
                ›
              </button>
            </div>
          )}

          <nav className="question-index" aria-label="Choose a question">
            {visibleQuestions.map((question, offset) => {
              const index = rangeStart + offset;
              const status = progress[question.id];
              const number = globalQuestionNumber(question);
              return (
                <button
                  className={`index-button ${index === resolvedIndex ? "is-active" : ""} ${status ? `is-${status}` : ""}`}
                  type="button"
                  key={question.id}
                  onClick={() => goToQuestion(collection, index)}
                  aria-current={index === resolvedIndex ? "step" : undefined}
                  aria-label={`Frage ${number}${status === "known" ? ", gelernt" : status === "review" ? ", wiederholen" : ""}`}
                >
                  <span>{String(number).padStart(3, "0")}</span>
                  {status && <i aria-hidden="true" />}
                </button>
              );
            })}
          </nav>

          <form className="question-jump" onSubmit={jumpToQuestion}>
            <label htmlFor="question-number">Gehe zu</label>
            <div>
              <input
                id="question-number"
                name="question-number"
                inputMode="numeric"
                min="1"
                max="310"
                defaultValue={currentGlobalNumber || 1}
                key={currentGlobalNumber}
                aria-label="Frage 1 bis 310"
                type="number"
              />
              <button type="submit" aria-label="Zur Frage springen">↗</button>
            </div>
          </form>

          <div className="rail-summary" aria-live="polite">
            <div><strong>{knownCount}</strong><span>gelernt</span></div>
            <div><strong>{reviewCount}</strong><span>wiederholen</span></div>
          </div>
        </aside>

        <main className="study-main">
          {currentQuestion ? (
            <section className="question-card" key={currentQuestion.id}>
              <div className="question-meta">
                <span>Frage {String(currentGlobalNumber).padStart(3, "0")}</span>
                <span className="meta-rule" />
                <span>{collectionLabel(collection)}</span>
              </div>

              <div className="question-copy">
                <p className="eyebrow">Offizielle Frage</p>
                <h1>{currentQuestion.question}</h1>
              </div>

              {currentQuestion.questionImage && (
                <figure className="question-figure map-figure">
                  <Image
                    src={currentQuestion.questionImage.src}
                    alt={currentQuestion.questionImage.alt}
                    width={currentQuestion.questionImage.width}
                    height={currentQuestion.questionImage.height}
                    sizes="(max-width: 900px) 90vw, 42vw"
                    priority
                  />
                  <figcaption>
                    {currentQuestion.id === "he-08"
                      ? "Die richtige Markierung ist Nummer 3."
                      : "Abbildung aus dem BAMF-Gesamtfragenkatalog."}
                  </figcaption>
                </figure>
              )}

              <div className="answer-block">
                <div className="answer-label">
                  <CheckIcon />
                  Richtige Antwort
                </div>
                <div className="answer-content">
                  <p>{currentQuestion.answer}</p>
                  {currentQuestion.answerImage && (
                    <Image
                      className="answer-image"
                      src={currentQuestion.answerImage.src}
                      alt={currentQuestion.answerImage.alt}
                      width={currentQuestion.answerImage.width}
                      height={currentQuestion.answerImage.height}
                      priority
                    />
                  )}
                </div>
              </div>

              <div className="study-actions" aria-label="Save your study status">
                <button
                  type="button"
                  className={`review-button ${currentStatus === "review" ? "is-selected" : ""}`}
                  aria-pressed={currentStatus === "review"}
                  onClick={() => updateStatus("review")}
                >
                  <BookmarkIcon />
                  Wiederholen
                </button>
                <button
                  type="button"
                  className={`known-button ${currentStatus === "known" ? "is-selected" : ""}`}
                  aria-pressed={currentStatus === "known"}
                  onClick={() => updateStatus("known")}
                >
                  <CheckIcon />
                  Kann ich
                </button>
              </div>
            </section>
          ) : (
            <section className="question-card empty-review">
              <p className="eyebrow">Wiederholen</p>
              <h1>Noch keine Fragen markiert.</h1>
              <p>
                Wähle bei einer Frage „Wiederholen“. Sie erscheint dann hier in deiner persönlichen Lernliste.
              </p>
              <button type="button" onClick={() => goToQuestion("general", 0)}>
                Mit Frage 1 beginnen
              </button>
            </section>
          )}

          <aside className="vocabulary-panel" aria-label="Vocabulary breakdown">
            <div className="vocabulary-heading">
              <div>
                <span className="vocabulary-icon"><BookIcon /></span>
                <span><small>Sprachhilfe</small><strong>Deutsch → Englisch</strong></span>
              </div>

              <div className="mode-switch" aria-label="Vocabulary display" role="group">
                <button
                  type="button"
                  className={mode === "words" ? "is-active" : ""}
                  aria-pressed={mode === "words"}
                  onClick={() => setMode("words")}
                >
                  Wörter
                </button>
                <button
                  type="button"
                  className={mode === "chunks" ? "is-active" : ""}
                  aria-pressed={mode === "chunks"}
                  onClick={() => setMode("chunks")}
                >
                  Wortgruppen
                </button>
              </div>
            </div>

            <div className="vocabulary-note">
              {mode === "words"
                ? "Einzelne Wörter in diesem Satzkontext."
                : "Frage und Antwort als natürliche Bedeutungseinheiten."}
            </div>

            <div className="vocabulary-table" role="table">
              <div className="vocabulary-row vocabulary-columns" role="row">
                <span role="columnheader">Deutsch</span>
                <span role="columnheader">English</span>
              </div>
              {vocabulary.map((item, index) => (
                <div
                  className="vocabulary-row"
                  role="row"
                  key={`${currentQuestion?.id ?? "empty"}-${mode}-${item.german}-${index}`}
                  style={{ animationDelay: `${index * 24}ms` }}
                >
                  <span role="cell">
                    {item.german}
                    {item.note && <small>{item.note}</small>}
                  </span>
                  <span role="cell">{item.english}</span>
                </div>
              ))}
            </div>
          </aside>
        </main>

        <nav className="card-navigation" aria-label="Question navigation">
          <button type="button" onClick={() => goRelative(-1)} disabled={!canGoBack}>
            <ArrowIcon direction="left" />
            <span>
              <small>Zurück</small>
              {canGoBack ? `Frage ${collection === "review" ? resolvedIndex : currentGlobalNumber - 1}` : "Start"}
            </span>
          </button>

          <div className="position-label" aria-live="polite">
            <strong>{String(overallPosition || 0).padStart(3, "0")}</strong>
            <span>/</span>
            <span>{overallTotal}</span>
          </div>

          <button
            type="button"
            className="next-button"
            onClick={() => goRelative(1)}
            disabled={!canGoForward}
          >
            <span>
              <small>Weiter</small>
              {canGoForward
                ? `Frage ${collection === "review" ? resolvedIndex + 2 : currentGlobalNumber + 1}`
                : "Fertig"}
            </span>
            <ArrowIcon direction="right" />
          </button>
        </nav>
      </div>

      <footer className="site-footer">
        <span>Klarland · 300 allgemein + 10 Hessen</span>
        <span>Prüfungsfragen: BAMF Gesamtfragenkatalog, Stand 07.05.2025</span>
        <span>Fortschritt bleibt nur auf diesem Gerät.</span>
      </footer>
    </div>
  );
}
