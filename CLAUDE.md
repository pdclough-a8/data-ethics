# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

An **Analytics8-branded e-learning site** about data ethics, built with [Astro](https://astro.build/). The course covers data collection, storage, usage, sharing, and destruction across 7 topic pages.

This is a from-scratch rebuild of an earlier [Adapt Learning](https://www.adaptlearning.org/)-based SCORM course. That version (and its SCORM/LMS plumbing) has been fully decommissioned — this project is standalone, not SCORM-tracked, and not intended to run through an LMS. The old course's files are recoverable via git history if ever needed, but nothing in this repo depends on them.

## Deployment

Deployment is automatic via GitHub Actions ([.github/workflows/static.yml](.github/workflows/static.yml)): push to `main` triggers `npm ci && npm run build`, and the built output (`dist/`) is published to GitHub Pages.

## Content Architecture

Course content lives in [src/content/](src/content/) as one JSON file per page (`data-collection.json`, `data-storage.json`, etc.), each holding an ordered array of `{type, ...props}` blocks:

```json
{ "title": "Data Collection", "duration": "6 minutes.", "blocks": [ { "type": "text", ... }, { "type": "mcq", ... } ] }
```

Each page file under [src/pages/](src/pages/) is just:

```astro
{content.blocks.map((block) => <Block block={block} />)}
```

[Block.astro](src/components/Block.astro) dispatches each entry to the matching component by its `type` field. The Introduction page ([src/pages/index.astro](src/pages/index.astro)) predates this pattern and has its content written directly in the page instead — functionally equivalent, just not yet converted to the same data-driven form.

## Component Types in Use

Each type has a matching `.astro` component in [src/components/](src/components/):

- `text` — narrative content ([Text.astro](src/components/Text.astro))
- `graphic` — images ([Graphic.astro](src/components/Graphic.astro))
- `accordion` — expandable sections ([Accordion.astro](src/components/Accordion.astro))
- `mcq` — multiple-choice knowledge checks, ungraded self-checks with no completion gating ([Mcq.astro](src/components/Mcq.astro))
- `narrative` — image+text carousel ([Narrative.astro](src/components/Narrative.astro))
- `hotgraphic` — clickable image hotspots ([Hotgraphic.astro](src/components/Hotgraphic.astro))
- `flipcard` — click-to-flip cards ([Flipcard.astro](src/components/Flipcard.astro))
- `reveal` — two-panel image/text reveal-on-click ([Reveal.astro](src/components/Reveal.astro))

## Theming

[src/styles/theme.css](src/styles/theme.css) holds the Analytics8 palette/typography as CSS custom properties — **currently provisional values estimated from the Brand Foundations Playbook's slide styling**, not confirmed hex codes or a real font spec. Update this one file once real brand assets (logo, colours, fonts) are available; everything else reads from these variables.

The header logo in [src/layouts/Layout.astro](src/layouts/Layout.astro) is currently a plain "Analytics8" text wordmark — swap in a real logo file (`public/logo.svg` preferred) when available.

## Progress & Interaction Tracking

[src/scripts/tracking.ts](src/scripts/tracking.ts) is the single module responsible for persisting page-visited and quiz-answer state (currently `localStorage` only, no LMS/SCORM). `Layout.astro` and `Mcq.astro` both call into it rather than touching storage directly — if LMS reporting is ever needed, this is the one file that should change.

## Making Content Changes

Edit the relevant page's JSON file under `src/content/`, or the `.astro` file directly for the Introduction page. `_id`-style uniqueness constraints from the old Adapt model no longer apply — content is just an ordered array per page.

[scripts/extract-content.mjs](scripts/extract-content.mjs) is the one-off script that originally migrated content out of the old Adapt JSON. It won't run as-is any more (its source, `course/en/`, was removed), but is kept for reference — see the comment at the top of that file for how to recover the old source from git history if it's ever needed again.

To add a new page: create `src/content/<slug>.json`, add a `src/pages/<slug>.astro` following the existing pattern, and add a nav entry to the `pages` array in `Layout.astro`.
