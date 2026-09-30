import { AI_CONTEXT_NAMES, AI_PROMPT_PROTOCOL, AI_PROMPT_TAGS } from '@tamanu/constants';

// Delimiter tags used to mark the untrusted regions of a summary prompt. Any
// literal occurrence inside the data would close its region early and let the
// remaining text read as prompt, so it is stripped before interpolation.
const DELIMITER_TAGS = [
  ...new Set([
    ...AI_PROMPT_PROTOCOL[AI_CONTEXT_NAMES.PATIENT_SUMMARY].tags,
    ...AI_PROMPT_PROTOCOL[AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY].tags,
  ]),
];

const DELIMITER_TAG_PATTERN = new RegExp(`</?(?:${DELIMITER_TAGS.join('|')})>`, 'gi');

const stripDelimiterTags = text => text.replace(DELIMITER_TAG_PATTERN, '');

const wrapInTag = (tag, content) => `<${tag}>${content}</${tag}>`;

/**
 * Build the human turn for a summary request: the record, plus any clinician
 * corrections, each in its own delimited region so the prompt can tell the model
 * to treat them as data rather than instructions.
 *
 * @param {object} options
 * @param {typeof AI_PROMPT_TAGS.PATIENT_DATA | typeof AI_PROMPT_TAGS.ENCOUNTER_DATA} options.dataTag
 * @param {unknown} options.data
 * @param {Array<{ aiGenerated?: string | null, userEdited?: string | null }>} options.editFeedback
 * @returns {string}
 */
export function buildSummaryUserMessage({ dataTag, data, editFeedback }) {
  const dataBlock = wrapInTag(dataTag, `\n${stripDelimiterTags(JSON.stringify(data, null, 2))}\n`);

  // A pair missing either half teaches the model nothing, and would otherwise
  // render the string "null" inside a tag that asserts real content.
  const corrections = editFeedback
    .filter(f => f.aiGenerated && f.userEdited)
    .map(f =>
      wrapInTag(
        AI_PROMPT_TAGS.CORRECTION,
        `\n${wrapInTag(AI_PROMPT_TAGS.AI_GENERATED, stripDelimiterTags(f.aiGenerated))}\n` +
          `${wrapInTag(AI_PROMPT_TAGS.CLINICIAN_EDITED, stripDelimiterTags(f.userEdited))}\n`,
      ),
    )
    .join('\n');

  return [
    dataBlock,
    corrections && wrapInTag(AI_PROMPT_TAGS.CLINICIAN_FEEDBACK, `\n${corrections}\n`),
  ]
    .filter(Boolean)
    .join('\n\n');
}
