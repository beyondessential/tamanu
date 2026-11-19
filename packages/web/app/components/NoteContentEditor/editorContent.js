import { parseNoteContent, serializeNoteContent } from '@tamanu/shared/utils/noteContent';

const STYLE_BY_TAG = { B: 'bold', STRONG: 'bold', I: 'italic', EM: 'italic', U: 'underline' };
const BLOCK_TAGS = new Set(['DIV', 'P']);
const NO_STYLES = { bold: false, italic: false, underline: false };

const getElementStyles = (element, inheritedStyles) => {
  const styles = { ...inheritedStyles };
  const tagStyle = STYLE_BY_TAG[element.nodeName];
  if (tagStyle) styles[tagStyle] = true;

  const { fontWeight, fontStyle, textDecoration, textDecorationLine } = element.style ?? {};
  if (fontWeight) styles.bold = fontWeight === 'bold' || Number(fontWeight) >= 600;
  if (fontStyle) styles.italic = fontStyle === 'italic';
  if (`${textDecoration} ${textDecorationLine}`.includes('underline')) styles.underline = true;
  return styles;
};

const getNextNonEmptySibling = node => {
  let sibling = node.nextSibling;
  while (sibling?.nodeType === Node.TEXT_NODE && !sibling.data) sibling = sibling.nextSibling;
  return sibling;
};

// A <br> that ends its line only holds the line open for the caret, so it is not a newline.
const isPlaceholderBreak = (breakElement, root) => {
  let current = breakElement;
  while (current !== root && !BLOCK_TAGS.has(current.nodeName)) {
    if (getNextNonEmptySibling(current)) return false;
    current = current.parentNode;
  }
  return true;
};

export const readEditorContent = root => {
  const segments = [];
  let lastCharacter = '';
  let hasPendingBlockBreak = false;

  const pushText = (text, styles) => {
    segments.push({ text, ...styles });
    lastCharacter = text.at(-1);
  };
  const flushBlockBreak = () => {
    if (!hasPendingBlockBreak) return;
    pushText('\n', NO_STYLES);
    hasPendingBlockBreak = false;
  };

  const walk = (node, styles) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.data) return;
      flushBlockBreak();
      pushText(node.data.replaceAll(' ', ' '), styles);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (node.nodeName === 'BR') {
      if (isPlaceholderBreak(node, root)) return;
      flushBlockBreak();
      pushText('\n', styles);
      return;
    }

    const isBlock = BLOCK_TAGS.has(node.nodeName);
    if (isBlock) {
      if (hasPendingBlockBreak) flushBlockBreak();
      else if (lastCharacter && lastCharacter !== '\n') pushText('\n', NO_STYLES);
    }
    const childStyles = getElementStyles(node, styles);
    node.childNodes.forEach(child => walk(child, childStyles));
    if (isBlock) hasPendingBlockBreak = true;
  };

  root.childNodes.forEach(child => walk(child, NO_STYLES));
  return serializeNoteContent(segments);
};

const STYLE_TAGS = [
  ['bold', 'b'],
  ['italic', 'i'],
  ['underline', 'u'],
];

export const writeEditorContent = (root, content) => {
  const { ownerDocument } = root;
  const segments = parseNoteContent(content);
  root.replaceChildren();
  for (const segment of segments) {
    let container = root;
    for (const [style, tag] of STYLE_TAGS) {
      if (!segment[style]) continue;
      container = container.appendChild(ownerDocument.createElement(tag));
    }
    segment.text.split('\n').forEach((line, index) => {
      if (index > 0) container.appendChild(ownerDocument.createElement('br'));
      if (line) container.appendChild(ownerDocument.createTextNode(line));
    });
  }
  if (segments.at(-1)?.text.endsWith('\n')) root.appendChild(ownerDocument.createElement('br'));
};
