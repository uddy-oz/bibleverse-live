# BibleVerse Live

BibleVerse Live is a church media tool built to help display Bible verses faster during sermons, Bible studies, services, and live events.

The goal is simple: when a pastor or speaker mentions a Bible reference, the media team should be able to show it on screen quickly without interrupting the flow of the service.

Live Demo: https://bibleverse-live.vercel.app/

## Features

* Instant Bible reference search
* Projector display mode at `/display`
* Open Display button for second screen use
* Next and previous verse controls
* Next and previous slide controls
* Bible book autocomplete
* Keyboard support for autocomplete suggestions
* Voice command foundation
* Local parser structure prepared for future AI assist mode
* Clean dark interface for church media use

## How It Works

BibleVerse Live has two main views:

### Controller View

The main page lets the media person search for a Bible reference, control slides, move between verses, and open the display screen.

### Display View

The `/display` page is designed for a projector, livestream screen, or second monitor. It shows the selected Bible verse in a large, clean format.

The controller and display page currently sync through browser localStorage, so they work best when used on the same device or browser.

## Example References

You can search references like:

* John 3:16
* Psalm 23:1-6
* Romans 8:28
* Matthew 6:33
* John 12
* 1 Corinthians 13:4

## Tech Stack

* React
* TypeScript
* Vite
* CSS
* Browser SpeechRecognition API
* localStorage
* Vercel

## Project Vision

BibleVerse Live is currently an early MVP, but the long-term goal is to build it into an AI assisted scripture display tool for churches and volunteer media teams.

Future ideas include:

* AI assisted verse detection
* Sermon context mode
* Preview queue before sending verses live
* Better voice command handling
* More display themes
* Church workspace settings
* Saved service history
* Safer multi-device display syncing

## Current AI Status

The app currently uses a local parser foundation for speech and command handling.

Gemini or other AI APIs are not connected yet. The codebase is being prepared so AI parsing can be added later through a safe backend or serverless endpoint without exposing API keys in the frontend.

## Running Locally

Clone the project:

```bash
git clone https://github.com/uddy-oz/bibleverse-live.git
cd bibleverse-live
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Deployment

This project is deployed with Vercel.

Production link:

https://bibleverse-live.vercel.app/

## Author

Built by Udochukwu Ozoh.

GitHub: https://github.com/uddy-oz
