// One-off content migration script: reads the original Adapt JSON (course →
// pages → articles → blocks → components) and flattens each page into an
// ordered list of {type, ...props} entries matching the Astro component
// props, so each page.astro can just be:
//
//   {content.blocks.map((block) => <Block block={block} />)}
//
// Kept for reference (and in case content ever needs re-deriving), but it
// won't run as-is any more: `course/en/` - its source data - was removed
// once migration was complete and the old Adapt course was decommissioned.
// It's still recoverable via git history (any commit before the cleanup
// that dropped adapt/, course/, etc.) if this script needs to run again.
//
// Originally run via `node scripts/extract-content.mjs` from the project
// root. Not part of the build - a migration tool, not a runtime dependency.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const courseDir = path.join(repoRoot, 'course/en');
const outDir = path.resolve(__dirname, '../src/content');
const assetsOutDir = path.resolve(__dirname, '../public/assets');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(assetsOutDir, { recursive: true });

const contentObjects = JSON.parse(fs.readFileSync(path.join(courseDir, 'contentObjects.json'), 'utf8'));
const articles = JSON.parse(fs.readFileSync(path.join(courseDir, 'articles.json'), 'utf8'));
const blocks = JSON.parse(fs.readFileSync(path.join(courseDir, 'blocks.json'), 'utf8'));
const components = JSON.parse(fs.readFileSync(path.join(courseDir, 'components.json'), 'utf8'));

const PAGES = [
  ['data-collection', '651446358ceafb6bdaa1ac56'],
  ['data-storage', '651449195843e577fed791c4'],
  ['data-usage', '65144e315a8ab59542ead025'],
  ['data-sharing', '651451e05a8ab59542ead54e'],
  ['data-destruction', '6514534ac40ee1f1040c0094'],
  ['conclusion', '651455f4c173eacbb438b782'],
];

function toPublicAsset(srcPath) {
  if (!srcPath) return '';
  const abs = path.resolve(repoRoot, srcPath);
  if (!fs.existsSync(abs)) {
    console.warn(`  ! missing asset: ${srcPath}`);
    return '';
  }
  const basename = path.basename(abs);
  const dest = path.join(assetsOutDir, basename);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(abs, dest);
  }
  return `/assets/${basename}`;
}

// Adapt leaves these generic default titles in place when an author never
// renamed the component - they're not meant to be shown as a visible
// heading, so strip them back to empty.
const PLACEHOLDER_TITLES = new Set(['Text', 'Graphic', 'Block title', 'Article title', 'Blank']);
function cleanTitle(title) {
  return PLACEHOLDER_TITLES.has(title) ? '' : (title ?? '');
}

// Some authored HTML carries inline styles from paste-in-from-Word/Docs
// (hardcoded font-family, font-size, text colour) that would fight the new
// theme's typography and link colours - inline styles have higher CSS
// specificity than anything in theme.css, so they'd render inconsistently
// per-block instead of following the shared design. Strip them; semantic
// tags (<strong>, <ul>, <a class="customlink">, etc.) are kept as-is.
function clean(html) {
  return (html ?? '').replace(/\sstyle=(["'])[\s\S]*?\1/gi, '');
}

function stripDuration(body) {
  const match = /Duration:\s*([^<]+)/.exec(body ?? '');
  return match ? match[1].trim() : '';
}

// One MCQ's instruction field was exported with its handlebars conditional
// un-rendered ("{{#if _isRadio}}one option{{else}}one or more options{{/if}}")
// - resolve it statically here rather than shipping raw template syntax.
function resolveInstruction(instruction, isRadio) {
  const conditional = /\{\{#if _isRadio\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if\}\}/;
  const match = conditional.exec(instruction ?? '');
  if (!match) return instruction ?? '';
  return instruction.replace(conditional, isRadio ? match[1] : match[2]);
}

function mapComponent(c) {
  switch (c._component) {
    case 'text':
      return { type: 'text', title: cleanTitle(c.title), body: clean(c.body) };

    case 'graphic':
      // Standalone "graphic" components use responsive large/small fields
      // instead of a flat src (unlike graphics nested in narrative/hotgraphic
      // items, which do use src directly) - prefer "large".
      return {
        type: 'graphic',
        alt: c._graphic?.alt ?? '',
        src: toPublicAsset(c._graphic?.src || c._graphic?.large || c._graphic?.small),
      };

    case 'accordion':
      return {
        type: 'accordion',
        title: cleanTitle(c.title),
        items: (c._items ?? []).map((i) => ({ title: i.title, body: clean(i.body) })),
      };

    case 'mcq':
      return {
        type: 'mcq',
        id: c._id,
        title: cleanTitle(c.title),
        instruction: resolveInstruction(c.instruction, c._selectable === 1),
        isRadio: c._selectable === 1,
        items: (c._items ?? []).map((i) => ({
          text: i.text,
          shouldBeSelected: !!i._shouldBeSelected,
        })),
        feedbackCorrect: clean(c._feedback?.correct),
        feedbackIncorrect: clean(c._feedback?._incorrect?.final),
        feedbackPartlyCorrect: clean(c._feedback?._partlyCorrect?.final),
      };

    case 'narrative':
      return {
        type: 'narrative',
        id: c._id,
        title: cleanTitle(c.title),
        body: clean(c.body),
        items: (c._items ?? []).map((i) => ({
          title: i.title,
          body: clean(i.body),
          graphicSrc: toPublicAsset(i._graphic?.src),
          graphicAlt: i._graphic?.alt ?? '',
        })),
      };

    case 'hotgraphic':
      return {
        type: 'hotgraphic',
        id: c._id,
        title: cleanTitle(c.title),
        body: clean(c.body),
        graphicSrc: toPublicAsset(c._graphic?.src),
        graphicAlt: c._graphic?.alt ?? '',
        items: (c._items ?? []).map((i) => ({
          title: i.title,
          body: clean(i.body),
          left: Math.round((i._left ?? 0) * 100) / 100,
          top: Math.round((i._top ?? 0) * 100) / 100,
        })),
      };

    case 'flipcard':
      return {
        type: 'flipcard',
        title: cleanTitle(c.title),
        body: clean(c.body),
        items: (c._items ?? []).map((i) => ({
          frontImageSrc: toPublicAsset(i.frontImage?.src),
          frontImageAlt: i.frontImage?.alt ?? '',
          backTitle: i.backTitle ?? '',
          backBody: clean(i.backBody),
        })),
      };

    case 'reveal':
      return {
        type: 'reveal',
        id: c._id,
        title: cleanTitle(c.title),
        showText: c.control?.showText ?? 'Show',
        hideText: c.control?.hideText ?? 'Hide',
        first: {
          src: toPublicAsset(c.first?.src),
          alt: c.first?.alt ?? '',
          body: clean(c.first?.body),
        },
        second: {
          src: toPublicAsset(c.second?.src),
          alt: c.second?.alt ?? '',
          body: clean(c.second?.body),
        },
      };

    case 'blank':
      return null; // layout spacer - nothing to render

    default:
      console.warn(`  ! unrecognised component type: ${c._component} (${c._id})`);
      return null;
  }
}

for (const [slug, pageId] of PAGES) {
  const page = contentObjects.find((p) => p._id === pageId);
  if (!page) {
    console.warn(`Page not found: ${pageId}`);
    continue;
  }

  const pageArticles = articles.filter((a) => a._parentId === pageId);
  const blockList = [];
  for (const article of pageArticles) {
    const articleBlocks = blocks.filter((b) => b._parentId === article._id);
    blockList.push(...articleBlocks);
  }

  const mapped = [];
  for (const block of blockList) {
    const blockComponents = components.filter((c) => c._parentId === block._id);
    for (const c of blockComponents) {
      const entry = mapComponent(c);
      if (entry) mapped.push(entry);
    }
  }

  const dump = {
    title: page.title,
    duration: stripDuration(page.body),
    blocks: mapped,
  };

  fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(dump, null, 2));
  console.log(`✓ ${slug}: ${mapped.length} components`);
}
