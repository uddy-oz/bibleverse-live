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
  { pattern: "song of solomon", display: "Song of Solomon" },
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

function getVerseClass(text: string) {
  if (text.length > 240) {
    return "verseText veryLongVerse";
  }

  if (text.length > 130) {
    return "verseText longVerse";
  }

  return "verseText";
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

  const speechRecognitionRef = useRef<any>(null);
  const lastDetectedReferenceRef = useRef("");
  const lastProcessedSpeechRef = useRef("");

  const isDisplayMode = window.location.pathname === "/display";
  const currentSlide = slides[currentSlideIndex];

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
    async (reference: string) => {
      try {
        setIsLoading(true);
        setMessage("");

        const result = await fetchBibleReference(reference, selectedVersion);
        const newSlides = makeBibleSlides(result);

        if (newSlides.length === 0) {
          setMessage("Verse not found. Try John 3:16 or Psalm 23:1-6.");
          return;
        }

        setCurrentResult(result);
        setReferenceInput(reference);
        setSlides(newSlides);
        setCurrentSlideIndex(0);
        updateDisplay(newSlides[0], selectedVersion, 0, newSlides.length);
      } catch (error) {
        console.error(error);
        setCurrentResult(null);
        setSlides([]);
        setCurrentSlideIndex(0);
        setMessage(
          "Verse not found. Try John 3:16, Matthew 6:33, or Psalm 23:1-6."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [selectedVersion, updateDisplay]
  );

  const showVerse = useCallback(() => {
    if (referenceInput.trim() === "") {
      setMessage("Type a Bible reference first.");
      return;
    }

    loadReference(referenceInput);
  }, [referenceInput, loadReference]);

  const showNextSlide = useCallback(() => {
    if (slides.length === 0) return;

    const nextIndex = Math.min(currentSlideIndex + 1, slides.length - 1);

    setCurrentSlideIndex(nextIndex);
    updateDisplay(slides[nextIndex], selectedVersion, nextIndex, slides.length);
  }, [slides, currentSlideIndex, selectedVersion, updateDisplay]);

  const showPreviousSlide = useCallback(() => {
    if (slides.length === 0) return;

    const previousIndex = Math.max(currentSlideIndex - 1, 0);

    setCurrentSlideIndex(previousIndex);
    updateDisplay(
      slides[previousIndex],
      selectedVersion,
      previousIndex,
      slides.length
    );
  }, [slides, currentSlideIndex, selectedVersion, updateDisplay]);

  const showNextVerse = useCallback(() => {
    if (!currentResult) return;

    const nextReference = makeNextVerseReference(currentResult);

    if (!nextReference) return;

    loadReference(nextReference);
  }, [currentResult, loadReference]);

  const showPreviousVerse = useCallback(() => {
    if (!currentResult) return;

    const previousReference = makePreviousVerseReference(currentResult);

    if (!previousReference) return;

    loadReference(previousReference);
  }, [currentResult, loadReference]);

  const clearDisplay = useCallback(() => {
    setReferenceInput("");
    setCurrentResult(null);
    setSlides([]);
    setCurrentSlideIndex(0);
    setDisplayVerse(null);
    setMessage("");
    setTranscript("");
    lastDetectedReferenceRef.current = "";
    lastProcessedSpeechRef.current = "";
    localStorage.removeItem("bibleverse_display");
  }, []);

  const processSpeech = useCallback(
    (spokenText: string) => {
      const cleanedSpeech = replaceNumberWords(cleanSpokenText(spokenText));

      if (!cleanedSpeech || cleanedSpeech === lastProcessedSpeechRef.current) {
        return;
      }

      lastProcessedSpeechRef.current = cleanedSpeech;

      if (cleanedSpeech.includes("next slide")) {
        showNextSlide();
        return;
      }

      if (
        cleanedSpeech.includes("previous slide") ||
        cleanedSpeech.includes("last slide")
      ) {
        showPreviousSlide();
        return;
      }

      if (cleanedSpeech.includes("next verse")) {
        showNextVerse();
        return;
      }

      if (
        cleanedSpeech.includes("previous verse") ||
        cleanedSpeech.includes("last verse")
      ) {
        showPreviousVerse();
        return;
      }

      if (cleanedSpeech.includes("clear display") || cleanedSpeech === "clear") {
        clearDisplay();
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
    ]
  );

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
        processSpeech(finalTranscript);
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
}, [processSpeech]);

  const stopListening = useCallback(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }

    setIsListening(false);
    setMessage("");
  }, []);

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
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
            onChange={(event) =>
              setSelectedVersion(event.target.value as BibleVersion)
            }
          >
            {availableBibleVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.id}
              </option>
            ))}
          </select>

          <input
            value={referenceInput}
            onChange={(event) => setReferenceInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Try John 3:16"
          />

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