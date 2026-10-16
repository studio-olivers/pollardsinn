#!/usr/bin/env node
/*
 * Copies the shared nav and footer out of index.html and into every other page.
 *
 * index.html is the single source of truth. Edit the nav or footer there, run
 * `node sync-partials.js`, and the other pages are rewritten to match. The
 * nav's `class="active"` is re-pointed at whichever page it lands on.
 *
 * Each block is delimited in the HTML by a matching pair of comments:
 *   <!-- SHARED NAV ... -->  ...  <!-- /SHARED NAV -->
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SOURCE = 'index.html';
const PAGES = ['index.html', 'about.html', 'food-and-drink.html', 'contact.html', 'privacy.html'];

const BLOCKS = [
  { name: 'nav', start: /<!-- SHARED NAV\b[^>]*-->/, end: /<!-- \/SHARED NAV -->/ },
  { name: 'footer', start: /<!-- SHARED FOOTER\b[^>]*-->/, end: /<!-- \/SHARED FOOTER -->/ },
];

// Pulls the text between (and including) a block's start and end markers.
function extract(html, block, file) {
  const open = html.match(block.start);
  const close = html.match(block.end);
  if (!open || !close) {
    throw new Error(`${file}: missing ${open ? 'closing' : 'opening'} ${block.name} marker`);
  }
  const from = open.index;
  const to = close.index + close[0].length;
  if (to <= from) throw new Error(`${file}: ${block.name} markers are out of order`);
  return { text: html.slice(from, to), from, to };
}

// The nav template carries whatever `active` index.html had — move it to `page`.
function setActive(nav, page) {
  const cleared = nav.replace(/(<li><a href="[^"]+")\s+class="active"/g, '$1');
  const marked = cleared.replace(new RegExp(`(<li><a href="${page}")`), '$1 class="active"');
  if (marked === cleared) {
    console.warn(`  ! no nav link found for ${page} — nothing marked active`);
  }
  return marked;
}

const source = fs.readFileSync(path.join(DIR, SOURCE), 'utf8');
const templates = Object.fromEntries(BLOCKS.map((b) => [b.name, extract(source, b, SOURCE).text]));

let changed = 0;

for (const page of PAGES) {
  const file = path.join(DIR, page);
  const original = fs.readFileSync(file, 'utf8');
  let html = original;

  // Rebuild back-to-front so the earlier block's offsets stay valid.
  for (const block of [...BLOCKS].reverse()) {
    const target = extract(html, block, page);
    const replacement = block.name === 'nav' ? setActive(templates.nav, page) : templates.footer;
    html = html.slice(0, target.from) + replacement + html.slice(target.to);
  }

  if (html !== original) {
    fs.writeFileSync(file, html);
    console.log(`  updated ${page}`);
    changed++;
  }
}

console.log(changed ? `\n${changed} page(s) synced from ${SOURCE}.` : `All pages already match ${SOURCE}.`);
