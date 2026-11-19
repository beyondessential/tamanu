// Note content is plain text that may carry exactly <b>, <i> and <u>. Anything else that looks
// like a tag is literal text, so this must never be rendered as HTML.
const STYLE_TAG = /<(\/?)([biu])>/g;

const STYLES = [
  ['bold', 'b'],
  ['italic', 'i'],
  ['underline', 'u'],
];
const STYLE_BY_TAG = Object.fromEntries(STYLES.map(([style, tag]) => [tag, style]));

export const parseNoteContent = content => {
  const text = content ?? '';
  const depth = { bold: 0, italic: 0, underline: 0 };
  const segments = [];
  const push = segmentText => {
    if (!segmentText) return;
    segments.push({
      text: segmentText,
      bold: depth.bold > 0,
      italic: depth.italic > 0,
      underline: depth.underline > 0,
    });
  };

  let lastIndex = 0;
  for (const match of text.matchAll(STYLE_TAG)) {
    push(text.slice(lastIndex, match.index));
    const style = STYLE_BY_TAG[match[2]];
    depth[style] = match[1] ? Math.max(0, depth[style] - 1) : depth[style] + 1;
    lastIndex = match.index + match[0].length;
  }
  push(text.slice(lastIndex));
  return segments;
};

export const stripNoteContentStyles = content => (content ?? '').replace(STYLE_TAG, '');

export const serializeNoteContent = segments => {
  let output = '';
  let open = [];
  for (const segment of segments) {
    if (!segment.text) continue;
    const wanted = STYLES.filter(([style]) => segment[style]).map(([, tag]) => tag);
    let kept = 0;
    while (kept < open.length && open[kept] === wanted[kept]) kept++;
    output += open
      .slice(kept)
      .reverse()
      .map(tag => `</${tag}>`)
      .join('');
    output += wanted
      .slice(kept)
      .map(tag => `<${tag}>`)
      .join('');
    output += segment.text;
    open = wanted;
  }
  output += open
    .reverse()
    .map(tag => `</${tag}>`)
    .join('');
  return output;
};
