# Data Ethics v2 (prototype)

Analytics8-branded rebuild of the Data Ethics learning object, decoupled from
the Adapt framework. Lives on the `rebuild/astro-a8` branch, fully separate
from the existing `adapt/`, `course/`, and root `index*.html` files so the
live SCORM course keeps working untouched while this is developed.

## Status

**All 7 pages ported** — Introduction, Data Collection, Data Storage, Data
Usage, Data Sharing, Data Destruction, Conclusion — using real content
migrated from the current course's JSON, not placeholder copy. Every
component type in use (`text`, `graphic`, `accordion`, `mcq`, `narrative`,
`hotgraphic`, `flipcard`, `reveal`) has a rebuilt equivalent, styled with a
**provisional** Analytics8 palette (see `src/styles/theme.css` — swap the
values there the moment real brand assets exist).

## Running it locally

```
cd v2-astro
npm install
npm run dev
```

Opens a local dev server (default `http://localhost:4321`) with hot-reload —
edit any `.astro` file or the theme and the browser updates instantly.

## How content gets in

Rather than hand-writing each page, content is migrated once via
`scripts/extract-content.mjs`, which reads the current course's
`course/en/*.json` (contentObjects → articles → blocks → components), flattens
each page into an ordered list of `{type, ...props}` entries, copies every
referenced image into `public/assets/`, and writes one JSON file per page
into `src/content/`. Each page (`src/pages/data-collection.astro`, etc.) is
then just:

```astro
{content.blocks.map((block) => <Block block={block} />)}
```

`Block.astro` dispatches each entry to the matching component
(`Text`, `Graphic`, `Accordion`, `Mcq`, `Narrative`, `Hotgraphic`, `Flipcard`,
`Reveal`) by its `type`. Re-run the script any time to re-pull from the
Adapt source (e.g. after a content edit there) — it's a migration tool, not
a build-time dependency, so it's safe to delete once this becomes the
primary source of truth.

The Introduction page (`src/pages/index.astro`) was hand-built first, before
the extraction script existed, and still has its content written directly in
the page rather than through `src/content/index.json` — functionally
identical, just not yet using the same data-driven pattern as the rest.

## Progress & quiz tracking

`src/scripts/tracking.ts` is the single module responsible for persistence
(currently `localStorage` only — see "Known placeholders"). `Layout.astro`
uses it for page-visited tracking and the nav/progress-bar UI; `Mcq.astro`
uses it for per-question answer state. Any future SCORM reporting should be
added inside this one file, not spread across components.

## Known placeholders / not done yet

- **Logo**: header currently shows a plain "Analytics8" text wordmark. The
  real ∞8 mark shared in chat is a flattened image, not a file on disk —
  save it as `public/logo.svg` (vector preferred) or `public/logo.png` and
  it can be wired into `src/layouts/Layout.astro` directly.
- **Colours/fonts**: `src/styles/theme.css` values are estimates read off
  the Brand Foundations Playbook's slide styling, not confirmed hex/type
  specs.
- **SCORM**: no `imsmanifest.xml` or SCORM API wrapper wiring yet — deferred
  per discussion (this course is unlikely to be used through an LMS). The
  tracking module is structured so this stays a contained addition if that
  changes.
- **Simplified interactions**: `Narrative`, `Hotgraphic`, and `Flipcard` are
  functional but deliberately simpler than Adapt's originals (no drag/swipe,
  no animated pin tooltips, no flip-animation timing options) — matches the
  "simpler approach" brief rather than a pixel-for-pixel port.
- Quizzes are ungraded self-checks with no completion gating, matching the
  current course's actual behaviour (confirmed against `course/config.json`
  — `_requireAssessmentCompleted: false`).
