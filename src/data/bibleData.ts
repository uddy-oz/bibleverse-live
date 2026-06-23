export type BibleVersion = "KJV";

export type BibleReference = {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
};

export type BibleVerseItem = {
  verseNumber: number;
  text: string;
};

export type BibleSlide = {
  reference: string;
  text: string;
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

export const bibleData: Record<
  BibleVersion,
  Record<string, Record<number, Record<number, string>>>
> = {
  KJV: {
    john: {
      3: {
        16: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        17: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.",
        18: "He that believeth on him is not condemned: but he that believeth not is condemned already.",
      },
    },
    romans: {
      8: {
        28: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
        29: "For whom he did foreknow, he also did predestinate to be conformed to the image of his Son.",
        30: "Moreover whom he did predestinate, them he also called.",
      },
    },
    psalm: {
      23: {
        1: "The Lord is my shepherd; I shall not want.",
        2: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
        3: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
        4: "Yea, though I walk through the valley of the shadow of death, I will fear no evil.",
        5: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
        6: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever.",
      },
    },
  },
};

function formatBookName(book: string) {
  return book.toUpperCase();
}

export function formatReference(reference: BibleReference) {
  const endVerse = reference.verseEnd;

  if (endVerse && endVerse !== reference.verseStart) {
    return `${formatBookName(reference.book)} ${reference.chapter}:${reference.verseStart}-${endVerse}`;
  }

  return `${formatBookName(reference.book)} ${reference.chapter}:${reference.verseStart}`;
}

function formatSlideReference(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number
) {
  if (startVerse === endVerse) {
    return `${formatBookName(book)} ${chapter}:${startVerse}`;
  }

  return `${formatBookName(book)} ${chapter}:${startVerse}-${endVerse}`;
}

export function getVerseItems(
  reference: BibleReference,
  version: BibleVersion
): BibleVerseItem[] {
  const chapterData =
    bibleData[version]?.[reference.book]?.[reference.chapter];

  if (!chapterData) {
    return [];
  }

  const start = reference.verseStart;
  const end = reference.verseEnd || reference.verseStart;

  const verses: BibleVerseItem[] = [];

  for (let verseNumber = start; verseNumber <= end; verseNumber++) {
    const verseText = chapterData[verseNumber];

    if (!verseText) {
      continue;
    }

    verses.push({
      verseNumber,
      text: verseText,
    });
  }

  return verses;
}

export function getVerse(reference: BibleReference, version: BibleVersion) {
  const verses = getVerseItems(reference, version);

  if (verses.length === 0) {
    return "";
  }

  if (verses.length === 1) {
    return verses[0].text;
  }

  return verses
    .map((verse) => `${verse.verseNumber}. ${verse.text}`)
    .join("\n\n");
}

export function getVerseSlides(
  reference: BibleReference,
  version: BibleVersion,
  versesPerSlide = 2
): BibleSlide[] {
  const verses = getVerseItems(reference, version);

  if (verses.length === 0) {
    return [];
  }

  const slides: BibleSlide[] = [];

  for (let index = 0; index < verses.length; index += versesPerSlide) {
    const slideVerses = verses.slice(index, index + versesPerSlide);
    const firstVerse = slideVerses[0].verseNumber;
    const lastVerse = slideVerses[slideVerses.length - 1].verseNumber;

    slides.push({
      reference: formatSlideReference(
        reference.book,
        reference.chapter,
        firstVerse,
        lastVerse
      ),
      text: slideVerses
        .map((verse) => `${verse.verseNumber}. ${verse.text}`)
        .join("\n\n"),
    });
  }

  return slides;
}

export function getNextVerse(reference: BibleReference): BibleReference {
  const currentEnd = reference.verseEnd || reference.verseStart;

  return {
    book: reference.book,
    chapter: reference.chapter,
    verseStart: currentEnd + 1,
  };
}

export function getPreviousVerse(reference: BibleReference): BibleReference {
  return {
    book: reference.book,
    chapter: reference.chapter,
    verseStart: Math.max(1, reference.verseStart - 1),
  };
}