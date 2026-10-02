import { convert as convertHtmlToText } from 'html-to-text';

const HTML_TAG_PATTERN = /<\/?[a-z][a-z0-9]*\b[^>]*>/i;

// Labs may send free text over FHIR as HTML, but we display and edit it as plain text (web and
// PDF), so flatten it on the way in. Text without tags is returned as-is, as html-to-text would
// collapse its line breaks.
export function htmlToPlainText(text: string): string {
  if (!HTML_TAG_PATTERN.test(text)) return text;

  return convertHtmlToText(text, {
    wordwrap: false,
    selectors: [{ selector: 'table', format: 'dataTable' }],
  })
    .replaceAll(' ', ' ')
    .trim();
}
