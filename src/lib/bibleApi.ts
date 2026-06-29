export type BibleVersion = "KJV";

export type BibleVerseItem = {
  bookName: string;
  chapter: number;
  verseNumber: number;
  text: string;
};

export type BibleSlide = {
  reference: string;
  text: string;
};

export type BibleResult = {
  reference: string;
  version: BibleVersion;
  verses: BibleVerseItem[];
};

type BibleApiVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleApiResponse = {
  reference: string;
  text: string;
  translation_id: string;
  translation_name: string;
  verses: BibleApiVerse[];
};

export const availableBibleVersions: {
  id: BibleVersion;
  name: string;
}[] = [
  {
    id: "KJV",
    name: "King James Version",
  },
];

function formatBookName(bookName: string) {
  return bookName.toUpperCase();
}

function formatVerseReference(verse: BibleVerseItem) {
  return `${formatBookName(verse.bookName)} ${verse.chapter}:${verse.verseNumber}`;
}

function formatSlideReference(verses: BibleVerseItem[]) {
  const firstVerse = verses[0];
  const lastVerse = verses[verses.length - 1];

  if (!firstVerse || !lastVerse) {
    return "";
  }

  const sameBook =
    firstVerse.bookName.toLowerCase() === lastVerse.bookName.toLowerCase();

  const sameChapter = firstVerse.chapter === lastVerse.chapter;

  if (sameBook && sameChapter && firstVerse.verseNumber === lastVerse.verseNumber) {
    return formatVerseReference(firstVerse);
  }

  if (sameBook && sameChapter) {
    return `${formatBookName(firstVerse.bookName)} ${firstVerse.chapter}:${firstVerse.verseNumber}-${lastVerse.verseNumber}`;
  }

  return `${formatVerseReference(firstVerse)} to ${formatVerseReference(lastVerse)}`;
}

function cleanBibleApiText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeReferenceInput(referenceInput: string) {
  return referenceInput
    .trim()
    .replace(/^songs?\s+of\s+songs?\b/i, "Song of Solomon")
    .replace(/^songs?\s+of\s+solomon\b/i, "Song of Solomon")
    .replace(/^song\s+solomon\b/i, "Song of Solomon")
    .replace(/^canticles\b/i, "Song of Solomon");
}

export async function fetchBibleReference(
  referenceInput: string,
  version: BibleVersion
): Promise<BibleResult> {
  const cleanReference = normalizeReferenceInput(referenceInput);

  if (!cleanReference) {
    throw new Error("Please type a Bible reference.");
  }

  const params = new URLSearchParams({
    translation: version.toLowerCase(),
  });

  const url = `https://bible-api.com/${encodeURIComponent(
    cleanReference
  )}?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Verse not found.");
  }

  const data: BibleApiResponse = await response.json();

  if (!data.verses || data.verses.length === 0) {
    throw new Error("Verse not found.");
  }

  const verses: BibleVerseItem[] = data.verses.map((verse) => ({
    bookName: verse.book_name,
    chapter: verse.chapter,
    verseNumber: verse.verse,
    text: cleanBibleApiText(verse.text),
  }));

  return {
    reference: formatSlideReference(verses),
    version,
    verses,
  };
}

export function makeBibleSlides(result: BibleResult): BibleSlide[] {
  const slides: BibleSlide[] = [];
  const MAX_CHARACTERS_PER_SLIDE = 180;

  let currentSlideVerses: BibleVerseItem[] = [];
  let currentCharacterCount = 0;

  function pushCurrentSlide() {
    if (currentSlideVerses.length === 0) {
      return;
    }

    slides.push({
      reference: formatSlideReference(currentSlideVerses),
      text: currentSlideVerses
        .map((verse) => {
          if (result.verses.length === 1) {
            return verse.text;
          }

          return `${verse.verseNumber}. ${verse.text}`;
        })
        .join("\n\n"),
    });

    currentSlideVerses = [];
    currentCharacterCount = 0;
  }

  result.verses.forEach((verse) => {
    const verseText = `${verse.verseNumber}. ${verse.text}`;
    const verseLength = verseText.length;

    const verseIsLong = verseLength > 120;
    const wouldBeTooLong =
      currentCharacterCount + verseLength > MAX_CHARACTERS_PER_SLIDE;

    if (
      currentSlideVerses.length > 0 &&
      (wouldBeTooLong || verseIsLong)
    ) {
      pushCurrentSlide();
    }

    currentSlideVerses.push(verse);
    currentCharacterCount += verseLength;

    if (verseIsLong) {
      pushCurrentSlide();
    }
  });

  pushCurrentSlide();

  return slides;
}

export function makeNextVerseReference(result: BibleResult) {
  const lastVerse = result.verses[result.verses.length - 1];

  if (!lastVerse) {
    return "";
  }

  return `${lastVerse.bookName} ${lastVerse.chapter}:${lastVerse.verseNumber + 1}`;
}

export function makePreviousVerseReference(result: BibleResult) {
  const firstVerse = result.verses[0];

  if (!firstVerse || firstVerse.verseNumber <= 1) {
    return "";
  }

  const previousVerseNumber = firstVerse.verseNumber - 1;

  return `${firstVerse.bookName} ${firstVerse.chapter}:${previousVerseNumber}`;
}
