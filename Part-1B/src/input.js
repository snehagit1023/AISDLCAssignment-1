const fs = require('node:fs/promises');
const { TextDecoder } = require('node:util');

const MAX_COMMENTS = 50;
const MAX_COMMENT_CODE_POINTS = 500;

// FR-001, FR-002, FR-014.
function parseComments(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Input must be UTF-8 text');
  }

  const nonblankLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (nonblankLines.length > MAX_COMMENTS) {
    throw new Error('Input must contain no more than 50 nonblank comments');
  }

  return nonblankLines.map((line, index) => {
    if ([...line].length > MAX_COMMENT_CODE_POINTS) {
      throw new Error(`Comment ${index + 1} exceeds 500 Unicode code points`);
    }
    return { id: index + 1, text: line };
  });
}

// FR-001, FR-002, FR-014.
async function readComments(filePath) {
  const bytes = await fs.readFile(filePath);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Input file is not valid UTF-8');
  }
  return parseComments(text);
}

module.exports = { parseComments, readComments };
