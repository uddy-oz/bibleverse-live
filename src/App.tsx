import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import "./App.css";
import {
  type BibleResult,
  type BibleSlide,
  type BibleVersion,
  availableBibleVersions,
  fetchBibleReference,
  makeBibleSlides,
  makeNextVerseReference,
  makePreviousVerseReference,
} from "./lib/bibleApi";

type DisplayVerse = {
  reference: string;
  text: string;
  version: BibleVersion;
  currentSlide: number;
  totalSlides: number;
};

type LatestBibleState = {
  referenceInput: string;
  selectedVersion: BibleVersion;
  currentResult: BibleResult | null;
  slides: BibleSlide[];
  currentSlideIndex: number;
};

type LastProcessedSpeech = {
  text: string;
  time: number;
};

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

const bibleBooks = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalm",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const writtenBookNumbers: Record<string, string> = {
  "1": "first",
  "2": "second",
  "3": "third",
};

const joBookSuggestionPriority: Record<string, number> = {
  John: 1,
  Joshua: 2,
  Joel: 3,
  Jonah: 4,
  Job: 5,
};

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

function getVerseClass(text: string) {
  if (text.length > 240) {
    return "verseText veryLongVerse";
  }

  if (text.length > 130) {
    return "verseText longVerse";
  }

  return "verseText";
}

function getProgressPercentage(currentIndex: number, total: number) {
  if (total <= 1) {
    return 100;
  }

  return Math.round(((currentIndex + 1) / total) * 100);
}

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

function extractBibleReference(spokenText: string) {
  const cleanedText = replaceNumberWords(cleanSpokenText(spokenText));

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

function normalizeBookSearchText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasChapterOrVersePart(input: string) {
  return /\s+\d/.test(input.trim());
}

function getBookSearchQuery(input: string) {
  const trimmedInput = input.trimStart();
  const chapterMatch = trimmedInput.match(/\s+\d/);

  if (chapterMatch?.index !== undefined) {
    return trimmedInput.slice(0, chapterMatch.index);
  }

  return trimmedInput;
}

function getBibleBookSearchParts(book: string) {
  const normalizedBook = normalizeBookSearchText(book);
  const numberedBookMatch = normalizedBook.match(/^([1-3])\s+(.+)$/);

  if (numberedBookMatch) {
    const [, bookNumber, baseBookName] = numberedBookMatch;
    const writtenNumber = writtenBookNumbers[bookNumber];

    return {
      baseName: baseBookName,
      displayName: normalizedBook,
      writtenNumberName: writtenNumber
        ? `${writtenNumber} ${baseBookName}`
        : "",
    };
  }

  return {
    baseName: normalizedBook,
    displayName: normalizedBook,
    writtenNumberName: "",
  };
}

function getBibleBookSuggestionScore(book: string, query: string) {
  const { baseName, displayName, writtenNumberName } =
    getBibleBookSearchParts(book);
  const allowBroadMatches = query.length >= 3;
  let matchRank: number | null = null;

  if (displayName === query) {
    matchRank = 0;
  } else if (baseName === query) {
    matchRank = 1;
  } else if (displayName.startsWith(query) || baseName.startsWith(query)) {
    matchRank = 2;
  } else if (allowBroadMatches && displayName.includes(query)) {
    matchRank = 3;
  } else if (allowBroadMatches && baseName.includes(query)) {
    matchRank = 4;
  } else if (
    allowBroadMatches &&
    writtenNumberName &&
    writtenNumberName.startsWith(query)
  ) {
    matchRank = 5;
  }

  if (matchRank === null) {
    return null;
  }

  const preferredRank = query.startsWith("jo")
    ? joBookSuggestionPriority[book] || 100
    : 100;

  return {
    matchRank,
    preferredRank,
    displayLength: book.length,
    bookIndex: bibleBooks.indexOf(book),
  };
}

function getBibleBookSuggestions(input: string) {
  if (!input.trim() || hasChapterOrVersePart(input)) {
    return [];
  }

  const query = normalizeBookSearchText(getBookSearchQuery(input));

  if (!query) {
    return [];
  }

  return bibleBooks
    .map((book) => ({
      book,
      score: getBibleBookSuggestionScore(book, query),
    }))
    .filter((suggestion): suggestion is {
      book: string;
      score: NonNullable<ReturnType<typeof getBibleBookSuggestionScore>>;
    } => {
      return suggestion.score !== null;
    })
    .sort((firstSuggestion, secondSuggestion) => {
      const firstScore = firstSuggestion.score;
      const secondScore = secondSuggestion.score;

      return (
        firstScore.matchRank - secondScore.matchRank ||
        firstScore.preferredRank - secondScore.preferredRank ||
        firstScore.bookIndex - secondScore.bookIndex ||
        firstScore.displayLength - secondScore.displayLength
      );
    })
    .map((suggestion) => suggestion.book)
    .slice(0, 8);
}

function applyBookSuggestion(input: string, bookName: string) {
  const trimmedInput = input.trimStart();
  const chapterMatch = trimmedInput.match(/\s+\d/);

  if (chapterMatch?.index !== undefined) {
    const restOfReference = trimmedInput.slice(chapterMatch.index).trimStart();

    return `${bookName} ${restOfReference}`;
  }

  return `${bookName} `;
}

function isSelectedPassage(result: BibleResult | null, slides: BibleSlide[]) {
  return Boolean(result && result.verses.length > 1 && slides.length > 0);
}

function App() {
  const [referenceInput, setReferenceInput] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>("KJV");
  const [currentResult, setCurrentResult] = useState<BibleResult | null>(null);
  const [slides, setSlides] = useState<BibleSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [displayVerse, setDisplayVerse] = useState<DisplayVerse | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);

  const speechRecognitionRef = useRef<any>(null);
  const processSpeechRef = useRef<(spokenText: string) => void>(() => {});
  const latestStateRef = useRef<LatestBibleState>({
    referenceInput: "",
    selectedVersion: "KJV",
    currentResult: null,
    slides: [],
    currentSlideIndex: 0,
  });
  const lastDetectedReferenceRef = useRef("");
  const lastProcessedSpeechRef = useRef<LastProcessedSpeech>({
    text: "",
    time: 0,
  });
  const voiceCommandCooldownRef = useRef({
    command: "",
    time: 0,
  });

  const isDisplayMode = window.location.pathname === "/display";
  const currentSlide = slides[currentSlideIndex];
  const bookSuggestions = getBibleBookSuggestions(referenceInput);
  const shouldShowBookSuggestions =
    showBookSuggestions && bookSuggestions.length > 0;

  const updateLatestState = useCallback(
    (partialState: Partial<LatestBibleState>) => {
      latestStateRef.current = {
        ...latestStateRef.current,
        ...partialState,
      };
    },
    []
  );

  useEffect(() => {
    latestStateRef.current = {
      referenceInput,
      selectedVersion,
      currentResult,
      slides,
      currentSlideIndex,
    };
  }, [referenceInput, selectedVersion, currentResult, slides, currentSlideIndex]);

  useEffect(() => {
    const savedVerse = localStorage.getItem("bibleverse_display");

    if (savedVerse) {
      setDisplayVerse(JSON.parse(savedVerse));
    }

    function handleStorageChange(event: StorageEvent) {
      if (event.key === "bibleverse_display" && event.newValue) {
        setDisplayVerse(JSON.parse(event.newValue));
      }

      if (event.key === "bibleverse_display" && !event.newValue) {
        setDisplayVerse(null);
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (isDisplayMode) {
      document.body.classList.add("displayModeBody");
    } else {
      document.body.classList.remove("displayModeBody");
    }

    return () => {
      document.body.classList.remove("displayModeBody");
    };
  }, [isDisplayMode]);

  const updateDisplay = useCallback(
    (
      slide: BibleSlide,
      version: BibleVersion,
      slideIndex: number,
      totalSlides: number
    ) => {
      const newDisplayVerse = {
        reference: slide.reference,
        text: slide.text,
        version,
        currentSlide: slideIndex + 1,
        totalSlides,
      };

      setDisplayVerse(newDisplayVerse);
      localStorage.setItem("bibleverse_display", JSON.stringify(newDisplayVerse));
    },
    []
  );

  const loadReference = useCallback(
    async (
      reference: string,
      options: {
        notFoundMessage?: string;
        preserveCurrentOnError?: boolean;
        version?: BibleVersion;
      } = {}
    ) => {
      try {
        setIsLoading(true);
        setMessage("");

        const version = options.version || latestStateRef.current.selectedVersion;
        const result = await fetchBibleReference(reference, version);
        const newSlides = makeBibleSlides(result);

        if (newSlides.length === 0) {
          setMessage(
            options.notFoundMessage ||
              "Verse not found. Try John 3:16 or Psalm 23:1-6."
          );
          return;
        }

        setCurrentResult(result);
        setReferenceInput(reference);
        setSlides(newSlides);
        setCurrentSlideIndex(0);
        updateLatestState({
          currentResult: result,
          referenceInput: reference,
          selectedVersion: version,
          slides: newSlides,
          currentSlideIndex: 0,
        });
        updateDisplay(newSlides[0], version, 0, newSlides.length);
      } catch (error) {
        console.error(error);

        if (!options.preserveCurrentOnError) {
          setCurrentResult(null);
          setSlides([]);
          setCurrentSlideIndex(0);
          updateLatestState({
            currentResult: null,
            slides: [],
            currentSlideIndex: 0,
          });
        }

        setMessage(
          options.notFoundMessage || "Verse not found. Give a Bible verse."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [updateDisplay, updateLatestState]
  );

  const showVerse = useCallback(() => {
    const referenceToLoad = latestStateRef.current.referenceInput.trim();

    if (referenceToLoad === "") {
      setMessage("Type a Bible reference first.");
      return;
    }

    loadReference(referenceToLoad);
  }, [loadReference]);

  const showNextSlide = useCallback(() => {
    const { slides, currentSlideIndex, selectedVersion } = latestStateRef.current;

    if (slides.length === 0) {
      setMessage("Load a verse first.");
      return;
    }

    if (currentSlideIndex >= slides.length - 1) {
      setMessage("You are already on the last slide.");
      return;
    }

    const nextIndex = currentSlideIndex + 1;

    setCurrentSlideIndex(nextIndex);
    updateLatestState({ currentSlideIndex: nextIndex });
    updateDisplay(slides[nextIndex], selectedVersion, nextIndex, slides.length);
  }, [updateDisplay, updateLatestState]);

  const showPreviousSlide = useCallback(() => {
    const { slides, currentSlideIndex, selectedVersion } = latestStateRef.current;

    if (slides.length === 0) {
      setMessage("Load a verse first.");
      return;
    }

    if (currentSlideIndex <= 0) {
      setMessage("You are already on the first slide.");
      return;
    }

    const previousIndex = currentSlideIndex - 1;

    setCurrentSlideIndex(previousIndex);
    updateLatestState({ currentSlideIndex: previousIndex });
    updateDisplay(
      slides[previousIndex],
      selectedVersion,
      previousIndex,
      slides.length
    );
  }, [updateDisplay, updateLatestState]);

  const showNextVerse = useCallback(() => {
    const { currentResult, slides, currentSlideIndex } = latestStateRef.current;

    if (!currentResult) {
      setMessage("Load a verse first.");
      return;
    }

    if (isSelectedPassage(currentResult, slides)) {
      if (currentSlideIndex < slides.length - 1) {
        showNextSlide();
        return;
      }
    }

    const nextReference = makeNextVerseReference(currentResult);

    if (!nextReference) {
      setMessage("You are already at the last verse of this chapter.");
      return;
    }

    loadReference(nextReference, {
      notFoundMessage: "You are already at the last verse of this chapter.",
      preserveCurrentOnError: true,
    });
  }, [showNextSlide, loadReference]);

  const showPreviousVerse = useCallback(() => {
    const { currentResult, slides, currentSlideIndex } = latestStateRef.current;

    if (!currentResult) {
      setMessage("Load a verse first.");
      return;
    }

    if (isSelectedPassage(currentResult, slides)) {
      if (currentSlideIndex > 0) {
        showPreviousSlide();
        return;
      }
    }

    const previousReference = makePreviousVerseReference(currentResult);

    if (!previousReference) {
      setMessage("You are already at the first verse of this chapter.");
      return;
    }

    loadReference(previousReference, {
      notFoundMessage: "You are already at the first verse of this chapter.",
      preserveCurrentOnError: true,
    });
  }, [showPreviousSlide, loadReference]);

  const clearDisplay = useCallback(() => {
    setReferenceInput("");
    setCurrentResult(null);
    setSlides([]);
    setCurrentSlideIndex(0);
    setDisplayVerse(null);
    setMessage("");
    setTranscript("");
    lastDetectedReferenceRef.current = "";
    lastProcessedSpeechRef.current = {
      text: "",
      time: 0,
    };
    updateLatestState({
      referenceInput: "",
      currentResult: null,
      slides: [],
      currentSlideIndex: 0,
    });
    localStorage.removeItem("bibleverse_display");
  }, [updateLatestState]);

  const runVoiceCommand = useCallback((command: string, action: () => void) => {
    const now = Date.now();
    const lastCommand = voiceCommandCooldownRef.current;

    if (lastCommand.command === command && now - lastCommand.time < 1200) {
      return;
    }

    voiceCommandCooldownRef.current = {
      command,
      time: now,
    };

    action();
  }, []);

  const processSpeech = useCallback(
    (spokenText: string) => {
      const cleanedSpeech = replaceNumberWords(cleanSpokenText(spokenText));
      const now = Date.now();
      const lastProcessedSpeech = lastProcessedSpeechRef.current;

      if (!cleanedSpeech) {
        return;
      }

      if (
        cleanedSpeech === lastProcessedSpeech.text &&
        now - lastProcessedSpeech.time < 500
      ) {
        return;
      }

      lastProcessedSpeechRef.current = {
        text: cleanedSpeech,
        time: now,
      };

      if (cleanedSpeech.includes("next slide")) {
        runVoiceCommand("nextSlide", showNextSlide);
        return;
      }

      if (
        cleanedSpeech.includes("previous slide") ||
        cleanedSpeech.includes("last slide")
      ) {
        runVoiceCommand("previousSlide", showPreviousSlide);
        return;
      }

      if (cleanedSpeech.includes("next verse")) {
        runVoiceCommand("nextVerse", showNextVerse);
        return;
      }

      if (
        cleanedSpeech.includes("previous verse") ||
        cleanedSpeech.includes("last verse")
      ) {
        runVoiceCommand("previousVerse", showPreviousVerse);
        return;
      }

      if (cleanedSpeech.includes("clear display") || cleanedSpeech === "clear") {
        runVoiceCommand("clearDisplay", clearDisplay);
        return;
      }

      const detectedReference = extractBibleReference(spokenText);

      if (
        detectedReference &&
        detectedReference !== lastDetectedReferenceRef.current
      ) {
        lastDetectedReferenceRef.current = detectedReference;
        loadReference(detectedReference);
      }
    },
    [
      showNextSlide,
      showPreviousSlide,
      showNextVerse,
      showPreviousVerse,
      clearDisplay,
      loadReference,
      runVoiceCommand,
    ]
  );

  useEffect(() => {
    processSpeechRef.current = processSpeech;
  }, [processSpeech]);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMessage(
        "Speech recognition is not supported in this browser. Try Google Chrome."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      setIsListening(true);
      setMessage("Starting microphone...");

      recognition.onstart = () => {
        setIsListening(true);
        setMessage("Listening for Bible references...");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const spokenPart = event.results[i][0].transcript.trim();

          if (event.results[i].isFinal) {
            finalTranscript += `${spokenPart} `;
          } else {
            interimTranscript += `${spokenPart} `;
          }
        }

        const visibleTranscript = `${finalTranscript} ${interimTranscript}`.trim();

        if (visibleTranscript) {
          setTranscript(visibleTranscript);
        }

        if (finalTranscript.trim()) {
          processSpeechRef.current(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);

        setIsListening(false);

        if (event.error === "not-allowed") {
          setMessage("Microphone permission was blocked. Allow microphone access.");
          return;
        }

        if (event.error === "no-speech") {
          setMessage("No speech detected. Try speaking closer to the mic.");
          return;
        }

        setMessage(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Could not start speech recognition:", error);
      setIsListening(false);
      setMessage("Could not start microphone. Try Google Chrome.");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }

    setIsListening(false);
    setMessage("");
  }, []);

  function selectBibleBook(bookName: string) {
    const nextReferenceInput = applyBookSuggestion(referenceInput, bookName);

    setReferenceInput(nextReferenceInput);
    updateLatestState({ referenceInput: nextReferenceInput });
    setShowBookSuggestions(false);
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      setShowBookSuggestions(false);
      showVerse();
    }
  }

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement;

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA";

      if (isTyping) {
        return;
      }

      if (event.key === "ArrowRight") {
        showNextSlide();
      }

      if (event.key === "ArrowLeft") {
        showPreviousSlide();
      }

      if (event.key.toLowerCase() === "n") {
        showNextVerse();
      }

      if (event.key.toLowerCase() === "p") {
        showPreviousVerse();
      }

      if (event.key === "Escape") {
        clearDisplay();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, [
    showNextSlide,
    showPreviousSlide,
    showNextVerse,
    showPreviousVerse,
    clearDisplay,
  ]);

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  if (isDisplayMode) {
    return (
      <main className="projectorPage">
        {displayVerse ? (
          <section className="projectorVerse">
            <p className="slideCount">
              Slide {displayVerse.currentSlide} of {displayVerse.totalSlides}
            </p>

            <div className="passageProgress projectorProgress">
              <div className="progressTrack">
                <div
                  className="progressFill"
                  style={{
                    width: `${getProgressPercentage(
                      displayVerse.currentSlide - 1,
                      displayVerse.totalSlides
                    )}%`,
                  }}
                />
              </div>
            </div>

            <h1>
              {displayVerse.reference} · {displayVerse.version}
            </h1>

            <p className={getVerseClass(displayVerse.text)}>
              {displayVerse.text}
            </p>
          </section>
        ) : (
          <section className="projectorVerse">
            <h1>BibleVerse Live</h1>
            <p>Waiting for verse...</p>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="app">
      <section className="controlPanel">
        <h1>BibleVerse Live</h1>
        <p>Type a Bible reference and display it instantly.</p>

        <div className="searchBox">
          <select
            className="versionSelect"
            value={selectedVersion}
            onChange={(event) => {
              const version = event.target.value as BibleVersion;

              setSelectedVersion(version);
              updateLatestState({ selectedVersion: version });
            }}
          >
            {availableBibleVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.id}
              </option>
            ))}
          </select>

          <div className="referenceInputWrap">
            <input
              value={referenceInput}
              onBlur={() => {
                window.setTimeout(() => setShowBookSuggestions(false), 120);
              }}
              onChange={(event) => {
                setReferenceInput(event.target.value);
                updateLatestState({ referenceInput: event.target.value });
                setShowBookSuggestions(true);
              }}
              onFocus={() => setShowBookSuggestions(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="Try John 3:16"
            />

            {shouldShowBookSuggestions && (
              <div className="bookSuggestions" role="listbox">
                {bookSuggestions.map((bookName) => (
                  <button
                    className="bookSuggestion"
                    key={bookName}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectBibleBook(bookName);
                    }}
                    type="button"
                    role="option"
                  >
                    {bookName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={showVerse} disabled={isLoading}>
            {isLoading ? "Loading..." : "Show Verse"}
          </button>

          <button onClick={showPreviousSlide}>Previous Slide</button>
          <button onClick={showNextSlide}>Next Slide</button>
          <button onClick={showPreviousVerse}>Previous Verse</button>
          <button onClick={showNextVerse}>Next Verse</button>

          <button
            className={isListening ? "listeningButton active" : "listeningButton"}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </button>

          <button className="secondaryButton" onClick={clearDisplay}>
            Clear
          </button>
        </div>

        {transcript && (
          <p className="speechTranscript">
            Heard: <strong>{transcript}</strong>
          </p>
        )}

        {message && <p className="speechMessage">{message}</p>}
      </section>

      <section className="displayScreen">
        {currentSlide ? (
          <>
            <p className="slideCount">
              Slide {currentSlideIndex + 1} of {slides.length}
            </p>

            <div className="passageProgress">
              <p>
                Position: {currentSlideIndex + 1} of {slides.length}
              </p>

              <div className="progressTrack">
                <div
                  className="progressFill"
                  style={{
                    width: `${getProgressPercentage(
                      currentSlideIndex,
                      slides.length
                    )}%`,
                  }}
                />
              </div>
            </div>

            <h2>
              {currentSlide.reference} · {selectedVersion}
            </h2>

            <p className={getVerseClass(currentSlide.text)}>
              {currentSlide.text}
            </p>
          </>
        ) : message ? (
          <>
            <h2>Notice</h2>
            <p>{message}</p>
          </>
        ) : (
          <>
            <h2>Waiting for verse...</h2>
            <p>The selected Bible verse will appear here.</p>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
