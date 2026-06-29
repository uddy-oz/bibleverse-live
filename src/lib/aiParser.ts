export type AiParserSource = "local";

export type AiCommand =
  | "nextVerse"
  | "previousVerse"
  | "nextSlide"
  | "previousSlide"
  | "clearDisplay";

type AiParsedBase = {
  confidence: number;
  normalizedText: string;
  rawText: string;
  source: AiParserSource;
};

export type AiParsedCommand = AiParsedBase & {
  type: "command";
  command: AiCommand;
};

export type AiParsedReference = AiParsedBase & {
  type: "reference";
  reference: string;
};

export type AiParsedSuggestion = AiParsedBase & {
  type: "suggestion";
  reference: string;
};

export type AiParsedUnknown = AiParsedBase & {
  type: "unknown";
};

export type AiParsedResult =
  | AiParsedCommand
  | AiParsedReference
  | AiParsedSuggestion
  | AiParsedUnknown;

const bibleBookAliases = [
  { pattern: "1 john", display: "1 John" },
  { pattern: "2 john", display: "2 John" },
  { pattern: "3 john", display: "3 John" },
  { pattern: "1 corinthians", display: "1 Corinthians" },
  { pattern: "2 corinthians", display: "2 Corinthians" },
  { pattern: "1 thessalonians", display: "1 Thessalonians" },
  { pattern: "2 thessalonians", display: "2 Thessalonians" },
  { pattern: "1 timothy", display: "1 Timothy" },
  { pattern: "2 timothy", display: "2 Timothy" },
  { pattern: "1 peter", display: "1 Peter" },
  { pattern: "2 peter", display: "2 Peter" },
  { pattern: "1 samuel", display: "1 Samuel" },
  { pattern: "2 samuel", display: "2 Samuel" },
  { pattern: "1 kings", display: "1 Kings" },
  { pattern: "2 kings", display: "2 Kings" },
  { pattern: "1 chronicles", display: "1 Chronicles" },
  { pattern: "2 chronicles", display: "2 Chronicles" },
  { pattern: "genesis", display: "Genesis" },
  { pattern: "exodus", display: "Exodus" },
  { pattern: "leviticus", display: "Leviticus" },
  { pattern: "numbers", display: "Numbers" },
  { pattern: "deuteronomy", display: "Deuteronomy" },
  { pattern: "joshua", display: "Joshua" },
  { pattern: "judges", display: "Judges" },
  { pattern: "ruth", display: "Ruth" },
  { pattern: "ezra", display: "Ezra" },
  { pattern: "nehemiah", display: "Nehemiah" },
  { pattern: "esther", display: "Esther" },
  { pattern: "job", display: "Job" },
  { pattern: "psalm", display: "Psalm" },
  { pattern: "psalms", display: "Psalm" },
  { pattern: "proverbs", display: "Proverbs" },
  { pattern: "ecclesiastes", display: "Ecclesiastes" },
  { pattern: "song of songs", display: "Song of Solomon" },
  { pattern: "song solomon", display: "Song of Solomon" },
  { pattern: "song of solomon", display: "Song of Solomon" },
  { pattern: "canticles", display: "Song of Solomon" },
  { pattern: "isaiah", display: "Isaiah" },
  { pattern: "jeremiah", display: "Jeremiah" },
  { pattern: "lamentations", display: "Lamentations" },
  { pattern: "ezekiel", display: "Ezekiel" },
  { pattern: "daniel", display: "Daniel" },
  { pattern: "hosea", display: "Hosea" },
  { pattern: "joel", display: "Joel" },
  { pattern: "amos", display: "Amos" },
  { pattern: "obadiah", display: "Obadiah" },
  { pattern: "jonah", display: "Jonah" },
  { pattern: "micah", display: "Micah" },
  { pattern: "nahum", display: "Nahum" },
  { pattern: "habakkuk", display: "Habakkuk" },
  { pattern: "zephaniah", display: "Zephaniah" },
  { pattern: "haggai", display: "Haggai" },
  { pattern: "zechariah", display: "Zechariah" },
  { pattern: "malachi", display: "Malachi" },
  { pattern: "matthew", display: "Matthew" },
  { pattern: "mark", display: "Mark" },
  { pattern: "luke", display: "Luke" },
  { pattern: "john", display: "John" },
  { pattern: "acts", display: "Acts" },
  { pattern: "romans", display: "Romans" },
  { pattern: "galatians", display: "Galatians" },
  { pattern: "ephesians", display: "Ephesians" },
  { pattern: "philippians", display: "Philippians" },
  { pattern: "colossians", display: "Colossians" },
  { pattern: "titus", display: "Titus" },
  { pattern: "philemon", display: "Philemon" },
  { pattern: "hebrews", display: "Hebrews" },
  { pattern: "james", display: "James" },
  { pattern: "jude", display: "Jude" },
  { pattern: "revelation", display: "Revelation" },
];

const numberWords: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

function replaceNumberWords(text: string) {
  const words = text.split(" ");
  const convertedWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];

    if (
      numberWords[currentWord] >= 20 &&
      nextWord &&
      numberWords[nextWord] > 0 &&
      numberWords[nextWord] < 10
    ) {
      convertedWords.push(String(numberWords[currentWord] + numberWords[nextWord]));
      i++;
      continue;
    }

    if (currentWord in numberWords) {
      convertedWords.push(String(numberWords[currentWord]));
      continue;
    }

    convertedWords.push(currentWord);
  }

  return convertedWords.join(" ");
}

function cleanSpokenText(text: string) {
  return text
    .toLowerCase()
    .replace(/\bfirst john\b/g, "1 john")
    .replace(/\bsecond john\b/g, "2 john")
    .replace(/\bthird john\b/g, "3 john")
    .replace(/\bfirst corinthians\b/g, "1 corinthians")
    .replace(/\bsecond corinthians\b/g, "2 corinthians")
    .replace(/\bfirst thessalonians\b/g, "1 thessalonians")
    .replace(/\bsecond thessalonians\b/g, "2 thessalonians")
    .replace(/\bfirst timothy\b/g, "1 timothy")
    .replace(/\bsecond timothy\b/g, "2 timothy")
    .replace(/\bfirst peter\b/g, "1 peter")
    .replace(/\bsecond peter\b/g, "2 peter")
    .replace(/\bfirst samuel\b/g, "1 samuel")
    .replace(/\bsecond samuel\b/g, "2 samuel")
    .replace(/\bfirst kings\b/g, "1 kings")
    .replace(/\bsecond kings\b/g, "2 kings")
    .replace(/\bfirst chronicles\b/g, "1 chronicles")
    .replace(/\bsecond chronicles\b/g, "2 chronicles")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSpokenText(spokenText: string) {
  return replaceNumberWords(cleanSpokenText(spokenText));
}

function extractBibleReference(spokenText: string) {
  const cleanedText = normalizeSpokenText(spokenText);

  for (const book of bibleBookAliases) {
    const bookRegex = new RegExp(`\\b${book.pattern}\\b`);
    const bookMatch = cleanedText.match(bookRegex);

    if (!bookMatch || bookMatch.index === undefined) {
      continue;
    }

    const afterBook = cleanedText.slice(bookMatch.index + bookMatch[0].length).trim();

    const referenceMatch = afterBook.match(
      /^(?:chapter\s+)?(\d+)(?:\s*(?:from\s+verses?|verses?|verse)?\s*(\d+))?(?:\s*(?:to|through|until)\s*(?:verses?|verse)?\s*(\d+))?/
    );

    if (!referenceMatch) {
      continue;
    }

    const chapter = referenceMatch[1];
    const startVerse = referenceMatch[2];
    const endVerse = referenceMatch[3];

    if (chapter && startVerse && endVerse) {
      return `${book.display} ${chapter}:${startVerse}-${endVerse}`;
    }

    if (chapter && startVerse) {
      return `${book.display} ${chapter}:${startVerse}`;
    }

    if (chapter) {
      return `${book.display} ${chapter}`;
    }
  }

  return null;
}

function makeBaseResult(rawText: string) {
  return {
    normalizedText: normalizeSpokenText(rawText),
    rawText,
    source: "local" as const,
  };
}

export function parseSpeechWithLocalParser(spokenText: string): AiParsedResult {
  const baseResult = makeBaseResult(spokenText);
  const cleanedSpeech = baseResult.normalizedText;

  if (!cleanedSpeech) {
    return {
      ...baseResult,
      confidence: 0,
      type: "unknown",
    };
  }

  if (cleanedSpeech.includes("next slide")) {
    return {
      ...baseResult,
      command: "nextSlide",
      confidence: 0.95,
      type: "command",
    };
  }

  if (
    cleanedSpeech.includes("previous slide") ||
    cleanedSpeech.includes("last slide")
  ) {
    return {
      ...baseResult,
      command: "previousSlide",
      confidence: 0.95,
      type: "command",
    };
  }

  if (cleanedSpeech.includes("next verse")) {
    return {
      ...baseResult,
      command: "nextVerse",
      confidence: 0.95,
      type: "command",
    };
  }

  if (
    cleanedSpeech.includes("previous verse") ||
    cleanedSpeech.includes("last verse")
  ) {
    return {
      ...baseResult,
      command: "previousVerse",
      confidence: 0.95,
      type: "command",
    };
  }

  if (cleanedSpeech.includes("clear display") || cleanedSpeech === "clear") {
    return {
      ...baseResult,
      command: "clearDisplay",
      confidence: 0.95,
      type: "command",
    };
  }

  const detectedReference = extractBibleReference(spokenText);

  if (detectedReference) {
    return {
      ...baseResult,
      confidence: 0.9,
      reference: detectedReference,
      type: "reference",
    };
  }

  return {
    ...baseResult,
    confidence: 0,
    type: "unknown",
  };
}
