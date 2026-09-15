// Remove all duplicate SEED_ACTIVITIES blocks from database.ts.
// Keep only the first occurrence (right after EMPTY_BUNDLE).
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'database.ts');
let src = fs.readFileSync(filePath, 'utf8');
const original = src;

const marker = 'const SEED_ACTIVITIES: Activity[]';
const indices = [];
let i = -1;
while ((i = src.indexOf(marker, i + 1)) !== -1) indices.push(i);
console.log(`Found ${indices.length} declarations.`);

if (indices.length < 2) { console.log('No duplicates — done.'); process.exit(0); }

// Find each block's start: walk backward through preceding comment/blank lines.
function blockStart(text, idx) {
  let start = idx;
  while (start > 0 && text[start - 1] !== '\n') start--;
  // walk back through preceding comment lines or blank lines
  while (start > 0) {
    const prevLineEnd = start - 1; // the \n at start-1
    if (prevLineEnd <= 0) break;
    let prevLineStart = prevLineEnd;
    while (prevLineStart > 0 && text[prevLineStart - 1] !== '\n') prevLineStart--;
    const prevLine = text.slice(prevLineStart, prevLineEnd);
    if (prevLine.startsWith('//') || prevLine.trim() === '') start = prevLineStart;
    else break;
  }
  return start;
}

// Find each block's end: matching `];` followed by blank line (or end of file).
function blockEnd(text, idx) {
  const end = text.indexOf('];', idx);
  if (end === -1) return -1;
  let e = end + 2;
  if (text[e] === '\n') e++;
  return e;
}

// Remove duplicates from highest to lowest so offsets don't shift.
let out = src;
for (let n = indices.length - 1; n >= 1; n--) {
  const dupIdx = indices[n];
  const start = blockStart(out, dupIdx);
  const end = blockEnd(out, dupIdx);
  if (end === -1) {
    console.error(`No closing ]; for #${n} at offset ${dupIdx}`);
    continue;
  }
  console.log(`Remove #${n}: ${start}..${end} (${end - start} chars)`);
  out = out.slice(0, start) + out.slice(end);
}

fs.writeFileSync(filePath, out, 'utf8');
console.log(`OK: ${out.length} bytes (was ${original.length}). Removed ${original.length - out.length}.`);
