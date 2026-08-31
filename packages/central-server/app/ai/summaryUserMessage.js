// Delimiter tags used to mark the untrusted regions of a summary prompt. Any
// literal occurrence inside the data would close its region early and let the
// remaining text read as prompt, so it is stripped before interpolation.
const DELIMITER_TAGS = [
  'patient_data',
  'encounter_data',
  'clinician_feedback',
  'correction',
  'ai_generated',
  'clinician_edited',
];

const DELIMITER_TAG_PATTERN = new RegExp(`</?(?:${DELIMITER_TAGS.join('|')})>`, 'gi');

const stripDelimiterTags = text => text.replace(DELIMITER_TAG_PATTERN, '');

/**
 * Build the human turn for a summary request: the record, plus any clinician
 * corrections, each in its own delimited region so the prompt can tell the model
 * to treat them as data rather than instructions.
 *
 * @param {object} options
 * @param {'patient_data' | 'encounter_data'} options.dataTag
 * @param {unknown} options.data
 * @param {Array<{ aiGenerated?: string | null, userEdited?: string | null }>} options.editFeedback
 * @returns {string}
 */
export function buildSummaryUserMessage({ dataTag, data, editFeedback }) {
  const dataBlock = `<${dataTag}>\n${stripDelimiterTags(
    JSON.stringify(data, null, 2),
  )}\n</${dataTag}>`;

  // A pair missing either half teaches the model nothing, and would otherwise
  // render the string "null" inside a tag that asserts real content.
  const corrections = editFeedback
    .filter(f => f.aiGenerated && f.userEdited)
    .map(
      f =>
        `<correction>\n` +
        `<ai_generated>${stripDelimiterTags(f.aiGenerated)}</ai_generated>\n` +
        `<clinician_edited>${stripDelimiterTags(f.userEdited)}</clinician_edited>\n` +
        `</correction>`,
    )
    .join('\n');

  return [dataBlock, corrections && `<clinician_feedback>\n${corrections}\n</clinician_feedback>`]
    .filter(Boolean)
    .join('\n\n');
}
