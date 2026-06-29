import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import "./App.css";
import { parseSpeechWithLocalParser } from "./lib/aiParser";
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

function normalizeBookSearchText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBookSearchQuery(input: string) {
  const trimmedInput = input.trimStart();
  const chapterMatch = trimmedInput.match(/\s+\d/);

  if (chapterMatch?.index !== undefined) {
    return trimmedInput.slice(0, chapterMatch.index);
  }

  return trimmedInput;
}

function inputHasChapterOrVersePart(input: string) {
  return /\s+\d/.test(input.trim());
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

function isExactBibleBookDisplayQuery(query: string) {
  return bibleBooks.some((book) => {
    const { displayName } = getBibleBookSearchParts(book);

    return displayName === query;
  });
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
  const query = normalizeBookSearchText(getBookSearchQuery(input));

  if (!query) {
    return [];
  }

  if (inputHasChapterOrVersePart(input) && isExactBibleBookDisplayQuery(query)) {
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

  return bookName;
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
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const speechRecognitionRef = useRef<any>(null);
  const processSpeechRef = useRef<(spokenText: string) => void>(() => {});
  const referenceInputWrapRef = useRef<HTMLDivElement | null>(null);
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
      const parsedSpeech = parseSpeechWithLocalParser(spokenText);
      const cleanedSpeech = parsedSpeech.normalizedText;
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

      if (parsedSpeech.type === "command") {
        const commandActions = {
          clearDisplay,
          nextSlide: showNextSlide,
          nextVerse: showNextVerse,
          previousSlide: showPreviousSlide,
          previousVerse: showPreviousVerse,
        };

        runVoiceCommand(
          parsedSpeech.command,
          commandActions[parsedSpeech.command]
        );
        return;
      }

      if (
        parsedSpeech.type === "reference" &&
        parsedSpeech.reference !== lastDetectedReferenceRef.current
      ) {
        lastDetectedReferenceRef.current = parsedSpeech.reference;
        loadReference(parsedSpeech.reference);
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

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [referenceInput, bookSuggestions.length]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        referenceInputWrapRef.current &&
        !referenceInputWrapRef.current.contains(target)
      ) {
        setShowBookSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

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
    setActiveSuggestionIndex(0);
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && shouldShowBookSuggestions) {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex >= bookSuggestions.length - 1 ? 0 : currentIndex + 1
      );
      return;
    }

    if (event.key === "ArrowUp" && shouldShowBookSuggestions) {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex <= 0 ? bookSuggestions.length - 1 : currentIndex - 1
      );
      return;
    }

    if (event.key === "Escape" && showBookSuggestions) {
      event.preventDefault();
      setShowBookSuggestions(false);
      return;
    }

    if (event.key === "Enter") {
      if (shouldShowBookSuggestions) {
        event.preventDefault();
        selectBibleBook(
          bookSuggestions[activeSuggestionIndex] || bookSuggestions[0]
        );
        return;
      }

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
        <p className="assistModeLabel">AI Assist: Local Parser</p>

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

          <div className="referenceInputWrap" ref={referenceInputWrapRef}>
            <input
              value={referenceInput}
              onChange={(event) => {
                setReferenceInput(event.target.value);
                updateLatestState({ referenceInput: event.target.value });
                setShowBookSuggestions(true);
              }}
              onFocus={() => {
                setShowBookSuggestions(true);
                setActiveSuggestionIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Try John 3:16"
            />

            {shouldShowBookSuggestions && (
              <div className="bookSuggestions" role="listbox">
                {bookSuggestions.map((bookName, index) => (
                  <button
                    className={
                      index === activeSuggestionIndex
                        ? "bookSuggestion active"
                        : "bookSuggestion"
                    }
                    key={bookName}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectBibleBook(bookName);
                    }}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
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
