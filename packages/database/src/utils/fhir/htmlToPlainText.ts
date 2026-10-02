import { convert as convertHtmlToText } from 'html-to-text';
import htmlTags from 'html-tags';

// Only real HTML elements count as markup, so placeholder-style text such as "<patient name>" or
// "<see attached>" in an otherwise plain-text result is never mistaken for a tag.
// An element name must be followed by whitespace, "/" or ">", so "<patient>" doesn't match "p"
const HTML_TAG_PATTERN = new RegExp(
  `<!--[\\s\\S]*?-->|<\\/?(?:${htmlTags.join('|')})(?=[\\s/>])[^<>]*>`,
  'gi',
);

const containsHtmlTag = (text: string) => text.search(HTML_TAG_PATTERN) !== -1;

// html-to-text drops anything that looks like a tag, so escape every "<" that doesn't open a real
// HTML tag to keep it as literal text
const escapeNonHtmlAngleBrackets = (text: string) =>
  text
    .split(/(<!--[\s\S]*?-->|<[^<>]*>)/)
    .map(segment =>
      segment.search(HTML_TAG_PATTERN) === 0 ? segment : segment.replaceAll('<', '&lt;'),
    )
    .join('');

// Labs may send free text over FHIR as HTML, but we display and edit it as plain text (web and
// PDF), so flatten it on the way in. Text without real HTML tags is returned as-is, as
// html-to-text would collapse its line breaks.
export function htmlToPlainText(text: string): string {
  if (!containsHtmlTag(text)) return text;

  return convertHtmlToText(escapeNonHtmlAngleBrackets(text), {
    wordwrap: false,
    selectors: [{ selector: 'table', format: 'dataTable' }],
  })
    .replaceAll('\u00a0', ' ')
    .trim();
}
