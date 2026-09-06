// One-off cleanup: delete the orphan UAE seed body from seed.ts.
// After the previous edit, lines 53-90 contain the no-op shim, and
// lines 92-186 contain the OLD UAE seed body (without a function
// wrapper). The orphan references `now()` which is in scope at
// module level so it doesn't crash, but it pollutes the bundle and
// will leak UAE properties if anyone re-enables the function.
//
// We delete lines 92-186 (inclusive) and the trailing blank line.

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'lib', 'seed.ts');
let src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');

// Find the marker. After the previous Edit, line 91 is empty, line 92
// starts the orphan UAE body. We need to find the end — look for the
// closing `}` of the orphan function (a `}` at column 0 on its own line)
// followed by an empty line and then a `// =====` block.

let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Legacy UAE seed body removed')) {
    // The actual orphan body is AFTER this comment block. Find it.
    // Skip until we see a line starting with "    { id: 'u001'"
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].includes("{ id: 'u001'")) { startIdx = j; break; }
    }
    break;
  }
}
if (startIdx < 0) { console.error('start not found'); process.exit(1); }

// End: the orphan function closes with `}` at column 0, followed by an
// empty line, then the "RICH DEMO DATA" comment block.
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i] === '}' && i + 2 < lines.length && lines[i+1] === '' && lines[i+2].includes('RICH DEMO DATA')) {
    endIdx = i;  // include the closing brace
    break;
  }
}
if (endIdx < 0) { console.error('end not found'); process.exit(1); }

console.log(`Removing orphan lines ${startIdx + 1}..${endIdx + 1} (${endIdx - startIdx + 1} lines)`);
const out = lines.slice(0, startIdx).concat(lines.slice(endIdx + 1)).join('\n');
fs.writeFileSync(file, out, 'utf8');
console.log(`OK: ${out.length} bytes (was ${src.length}). Removed ${src.length - out.length}.`);
