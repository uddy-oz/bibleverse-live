import type { BibleReference } from "../data/bibleData";

function cleanInput(input: string) {
  return input
    .toLowerCase()
    .replace(/chapter/g, "")
    .replace(/verses/g, "")
    .replace(/verse/g, "")
    .replace(/to/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBookName(book: string) {
  const cleanedBook = book.trim();

  if (cleanedBook === "psalms") {
    return "psalm";
  }

  return cleanedBook;
}

export function parseBibleReference(input: string): BibleReference | null {
  const cleaned = cleanInput(input);

  const match = cleaned.match(/^([1-3]?\s?[a-z]+)\s+(\d+)(?::|\s)(\d+)(?:\s*-\s*(\d+))?$/);

  if (!match) {
    return null;
  }

  const book = normalizeBookName(match[1]);
  const chapter = Number(match[2]);
  const verseStart = Number(match[3]);
  const verseEnd = match[4] ? Number(match[4]) : undefined;

  if (!book || !chapter || !verseStart) {
    return null;
  }

  if (verseEnd && verseEnd < verseStart) {
    return null;
  }

  return {
    book,
    chapter,
    verseStart,
    verseEnd,
  };
}