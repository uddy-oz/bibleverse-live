import { useCallback, useEffect, useState } from "react";
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

function getVerseClass(text: string) {
  if (text.length > 240) {
    return "verseText veryLongVerse";
  }

  if (text.length > 130) {
    return "verseText longVerse";
  }

  return "verseText";
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
      localStorage.setItem(
        "bibleverse_display",
        JSON.stringify(newDisplayVerse)
      );
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
    localStorage.removeItem("bibleverse_display");
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

          <button className="secondaryButton" onClick={clearDisplay}>
            Clear
          </button>
        </div>
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