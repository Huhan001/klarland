export type VocabularyItem = {
  german: string;
  english: string;
  note?: string;
};

export type StudyQuestion = {
  id: string;
  number: number;
  question: string;
  answer: string;
  questionEnglish?: string;
  answerEnglish?: string;
  words?: VocabularyItem[];
  chunks?: VocabularyItem[];
  questionImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  answerImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export const hessenQuestions: StudyQuestion[] = [
  {
    id: "he-01",
    number: 1,
    question: "Welches Wappen gehört zum Bundesland Hessen?",
    answer: "Bild 1",
    answerImage: {
      src: "/images/hessen-coat-of-arms.png",
      alt: "Das Wappen des Bundeslandes Hessen: ein rot-weiß gestreifter Löwe auf blauem Schild",
      width: 300,
      height: 390,
    },
    words: [
      { german: "Welches", english: "which" },
      { german: "Wappen", english: "coat of arms", note: "das Wappen" },
      { german: "gehört", english: "belongs", note: "gehören" },
      { german: "zum", english: "to the", note: "zu + dem" },
      { german: "Bundesland", english: "federal state", note: "das Bundesland" },
      { german: "Hessen", english: "Hesse" },
      { german: "Bild 1", english: "image 1" },
    ],
    chunks: [
      { german: "Welches Wappen", english: "which coat of arms" },
      { german: "gehört zum", english: "belongs to the" },
      { german: "Bundesland Hessen", english: "federal state of Hesse" },
      { german: "Bild 1", english: "image 1" },
    ],
  },
  {
    id: "he-02",
    number: 2,
    question: "Welches ist ein Landkreis in Hessen?",
    answer: "Main-Taunus-Kreis",
    words: [
      { german: "Welches", english: "which one" },
      { german: "ist", english: "is", note: "sein" },
      { german: "ein", english: "a" },
      { german: "Landkreis", english: "rural district", note: "der Landkreis" },
      { german: "in", english: "in" },
      { german: "Hessen", english: "Hesse" },
      { german: "Main-Taunus-Kreis", english: "Main-Taunus district" },
    ],
    chunks: [
      { german: "Welches ist", english: "which one is" },
      { german: "ein Landkreis", english: "a rural district" },
      { german: "in Hessen", english: "in Hesse" },
      { german: "Main-Taunus-Kreis", english: "Main-Taunus district" },
    ],
  },
  {
    id: "he-03",
    number: 3,
    question: "Für wie viele Jahre wird der Landtag in Hessen gewählt?",
    answer: "5 Jahre",
    words: [
      { german: "Für", english: "for" },
      { german: "wie viele", english: "how many" },
      { german: "Jahre", english: "years", note: "das Jahr" },
      { german: "wird", english: "is", note: "werden; forms the passive" },
      { german: "der", english: "the" },
      { german: "Landtag", english: "state parliament", note: "der Landtag" },
      { german: "in", english: "in" },
      { german: "Hessen", english: "Hesse" },
      { german: "gewählt", english: "elected", note: "wählen" },
      { german: "5", english: "five" },
    ],
    chunks: [
      { german: "Für wie viele Jahre", english: "for how many years" },
      { german: "wird gewählt", english: "is elected" },
      { german: "der Landtag", english: "the state parliament" },
      { german: "in Hessen", english: "in Hesse" },
      { german: "5 Jahre", english: "five years" },
    ],
  },
  {
    id: "he-04",
    number: 4,
    question: "Ab welchem Alter darf man in Hessen bei Kommunalwahlen wählen?",
    answer: "18 Jahre",
    words: [
      { german: "Ab", english: "from" },
      { german: "welchem", english: "which" },
      { german: "Alter", english: "age", note: "das Alter" },
      { german: "darf", english: "may / is allowed to", note: "dürfen" },
      { german: "man", english: "one / people" },
      { german: "in", english: "in" },
      { german: "Hessen", english: "Hesse" },
      { german: "bei", english: "in / at" },
      { german: "Kommunalwahlen", english: "local elections", note: "die Kommunalwahl" },
      { german: "wählen", english: "vote" },
      { german: "18", english: "eighteen" },
    ],
    chunks: [
      { german: "Ab welchem Alter", english: "from what age" },
      { german: "darf man wählen", english: "is one allowed to vote" },
      { german: "bei Kommunalwahlen", english: "in local elections" },
      { german: "in Hessen", english: "in Hesse" },
      { german: "18 Jahre", english: "eighteen years" },
    ],
  },
  {
    id: "he-05",
    number: 5,
    question: "Welche Farben hat die Landesflagge von Hessen?",
    answer: "rot-weiß",
    words: [
      { german: "Welche", english: "which" },
      { german: "Farben", english: "colours", note: "die Farbe" },
      { german: "hat", english: "has", note: "haben" },
      { german: "die", english: "the" },
      { german: "Landesflagge", english: "state flag", note: "die Landesflagge" },
      { german: "von", english: "of" },
      { german: "Hessen", english: "Hesse" },
      { german: "rot", english: "red" },
      { german: "weiß", english: "white" },
    ],
    chunks: [
      { german: "Welche Farben", english: "which colours" },
      { german: "hat die Landesflagge", english: "does the state flag have" },
      { german: "von Hessen", english: "of Hesse" },
      { german: "rot-weiß", english: "red and white" },
    ],
  },
  {
    id: "he-06",
    number: 6,
    question: "Wo können Sie sich in Hessen über politische Themen informieren?",
    answer: "bei der Landeszentrale für politische Bildung",
    words: [
      { german: "Wo", english: "where" },
      { german: "können", english: "can" },
      { german: "Sie", english: "you", note: "formal" },
      { german: "sich", english: "yourself / oneself" },
      { german: "in", english: "in" },
      { german: "Hessen", english: "Hesse" },
      { german: "über", english: "about" },
      { german: "politische", english: "political" },
      { german: "Themen", english: "topics", note: "das Thema" },
      { german: "informieren", english: "get information" },
      { german: "bei", english: "at / through" },
      { german: "der", english: "the" },
      { german: "Landeszentrale", english: "state centre", note: "die Landeszentrale" },
      { german: "für", english: "for" },
      { german: "politische", english: "civic / political" },
      { german: "Bildung", english: "education", note: "die Bildung" },
    ],
    chunks: [
      { german: "Wo können Sie", english: "where can you" },
      { german: "sich informieren", english: "get information / inform yourself" },
      { german: "über politische Themen", english: "about political topics" },
      { german: "in Hessen", english: "in Hesse" },
      { german: "bei der", english: "at / through the" },
      {
        german: "Landeszentrale für politische Bildung",
        english: "State Centre for Civic Education",
      },
    ],
  },
  {
    id: "he-07",
    number: 7,
    question: "Die Landeshauptstadt von Hessen heißt …",
    answer: "Wiesbaden.",
    words: [
      { german: "Die", english: "the" },
      { german: "Landeshauptstadt", english: "state capital", note: "die Landeshauptstadt" },
      { german: "von", english: "of" },
      { german: "Hessen", english: "Hesse" },
      { german: "heißt", english: "is called", note: "heißen" },
      { german: "Wiesbaden", english: "Wiesbaden" },
    ],
    chunks: [
      { german: "Die Landeshauptstadt", english: "the state capital" },
      { german: "von Hessen", english: "of Hesse" },
      { german: "heißt", english: "is called" },
      { german: "Wiesbaden", english: "Wiesbaden" },
    ],
  },
  {
    id: "he-08",
    number: 8,
    question: "Welches Bundesland ist Hessen?",
    answer: "Bild 3",
    questionImage: {
      src: "/images/hessen-map-question.png",
      alt: "Karte Deutschlands mit vier nummerierten Pfeilen; Pfeil 3 zeigt auf Hessen",
      width: 880,
      height: 650,
    },
    words: [
      { german: "Welches", english: "which" },
      { german: "Bundesland", english: "federal state", note: "das Bundesland" },
      { german: "ist", english: "is", note: "sein" },
      { german: "Hessen", english: "Hesse" },
      { german: "Bild 3", english: "image 3" },
    ],
    chunks: [
      { german: "Welches Bundesland", english: "which federal state" },
      { german: "ist Hessen", english: "is Hesse" },
      { german: "Bild 3", english: "image 3" },
    ],
  },
  {
    id: "he-09",
    number: 9,
    question: "Wie nennt man die Regierungschefin/den Regierungschef in Hessen?",
    answer: "Ministerpräsidentin/Ministerpräsident",
    words: [
      { german: "Wie", english: "what / how" },
      { german: "nennt", english: "calls", note: "nennen" },
      { german: "man", english: "one / people" },
      { german: "die", english: "the" },
      { german: "Regierungschefin", english: "female head of government" },
      { german: "den", english: "the" },
      { german: "Regierungschef", english: "head of government" },
      { german: "in", english: "in" },
      { german: "Hessen", english: "Hesse" },
      { german: "Ministerpräsidentin", english: "female Minister-President" },
      { german: "Ministerpräsident", english: "Minister-President" },
    ],
    chunks: [
      { german: "Wie nennt man", english: "what does one call" },
      {
        german: "die Regierungschefin/den Regierungschef",
        english: "the female/male head of government",
      },
      { german: "in Hessen", english: "in Hesse" },
      {
        german: "Ministerpräsidentin/Ministerpräsident",
        english: "female/male Minister-President",
      },
    ],
  },
  {
    id: "he-10",
    number: 10,
    question: "Welche Ministerin/welchen Minister hat Hessen nicht?",
    answer: "Außenministerin/Außenminister",
    words: [
      { german: "Welche", english: "which" },
      { german: "Ministerin", english: "female minister" },
      { german: "welchen", english: "which" },
      { german: "Minister", english: "minister" },
      { german: "hat", english: "has", note: "haben" },
      { german: "Hessen", english: "Hesse" },
      { german: "nicht", english: "not" },
      { german: "Außenministerin", english: "female foreign minister" },
      { german: "Außenminister", english: "foreign minister" },
    ],
    chunks: [
      {
        german: "Welche Ministerin/welchen Minister",
        english: "which female/male minister",
      },
      { german: "hat Hessen nicht", english: "does Hesse not have" },
      {
        german: "Außenministerin/Außenminister",
        english: "female/male foreign minister",
      },
    ],
  },
];
