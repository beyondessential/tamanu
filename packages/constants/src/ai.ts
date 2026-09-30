export const AI_CONTEXT_NAMES = {
  PATIENT_SUMMARY: 'patientSummary',
  ENCOUNTER_SUMMARY: 'encounterSummary',
  FORM_BUILDER: 'formBuilder',
  FORM_BUILDER_BUILD: 'formBuilderBuildSurveyDefinition',
  FORM_BUILDER_TWEAK: 'formBuilderTweakSurveyDefinition',
  FORM_BUILDER_IMAGE: 'formBuilderInterpretFormImage',
} as const;

// Delimiter tags wrapping regions of a summary user message, written as
// `<tag>…</tag>`.
export const AI_PROMPT_TAGS = {
  PATIENT_DATA: 'patient_data',
  ENCOUNTER_DATA: 'encounter_data',
  CLINICIAN_FEEDBACK: 'clinician_feedback',
  CORRECTION: 'correction',
  AI_GENERATED: 'ai_generated',
  CLINICIAN_EDITED: 'clinician_edited',
} as const;

// Markers opening a section of a form builder user message.
export const AI_PROMPT_MARKERS = {
  PROGRAM_SELECTED: '[PROGRAM SELECTED]',
  FORM_IMAGE_INTERPRETED: '[FORM IMAGE INTERPRETED]',
  PDF_DOCUMENT_INTERPRETED: '[PDF DOCUMENT INTERPRETED]',
  PDF_DOCUMENT_LOADED: '[PDF DOCUMENT LOADED]',
  CSV_DOCUMENT_LOADED: '[CSV DOCUMENT LOADED]',
  TEXT_DOCUMENT_LOADED: '[TEXT DOCUMENT LOADED]',
  XLSX_DOCUMENT_LOADED: '[XLSX DOCUMENT LOADED]',
  CURRENT_PROGRAM_DEFINITION: '[CURRENT PROGRAM DEFINITION]',
  LATEST_USER_REQUEST: '[LATEST USER REQUEST]',
  ASSISTANT_RESPONSE: '[ASSISTANT RESPONSE]',
  TRANSCRIPT_HUMAN: '[human]',
  TRANSCRIPT_AI: '[ai]',
} as const;

const SUMMARY_FEEDBACK_TAGS = [
  AI_PROMPT_TAGS.CLINICIAN_FEEDBACK,
  AI_PROMPT_TAGS.CORRECTION,
  AI_PROMPT_TAGS.AI_GENERATED,
  AI_PROMPT_TAGS.CLINICIAN_EDITED,
];

const FORM_BUILDER_FILE_MARKERS = [
  AI_PROMPT_MARKERS.FORM_IMAGE_INTERPRETED,
  AI_PROMPT_MARKERS.PDF_DOCUMENT_INTERPRETED,
  AI_PROMPT_MARKERS.PDF_DOCUMENT_LOADED,
  AI_PROMPT_MARKERS.CSV_DOCUMENT_LOADED,
  AI_PROMPT_MARKERS.TEXT_DOCUMENT_LOADED,
  AI_PROMPT_MARKERS.XLSX_DOCUMENT_LOADED,
];

/**
 * The protocol each context's system prompt may rely on: the tags and markers
 * the code writes into its user message. Deployments may override these prompts
 * in settings, so removing or renaming anything here breaks those overrides.
 * The prompt protocol ledger in central-server records every token that has
 * shipped, and its test fails on an unrecorded removal.
 */
export const AI_PROMPT_PROTOCOL = {
  [AI_CONTEXT_NAMES.PATIENT_SUMMARY]: {
    tags: [AI_PROMPT_TAGS.PATIENT_DATA, ...SUMMARY_FEEDBACK_TAGS],
    markers: [],
  },
  [AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY]: {
    tags: [AI_PROMPT_TAGS.ENCOUNTER_DATA, ...SUMMARY_FEEDBACK_TAGS],
    markers: [],
  },
  [AI_CONTEXT_NAMES.FORM_BUILDER]: {
    tags: [],
    markers: [AI_PROMPT_MARKERS.PROGRAM_SELECTED, ...FORM_BUILDER_FILE_MARKERS],
  },
  // With no current definition, the build input is the session transcript,
  // which carries the conversational turns and their file markers.
  [AI_CONTEXT_NAMES.FORM_BUILDER_BUILD]: {
    tags: [],
    markers: [
      AI_PROMPT_MARKERS.CURRENT_PROGRAM_DEFINITION,
      AI_PROMPT_MARKERS.LATEST_USER_REQUEST,
      AI_PROMPT_MARKERS.ASSISTANT_RESPONSE,
      AI_PROMPT_MARKERS.TRANSCRIPT_HUMAN,
      AI_PROMPT_MARKERS.TRANSCRIPT_AI,
      AI_PROMPT_MARKERS.PROGRAM_SELECTED,
      ...FORM_BUILDER_FILE_MARKERS,
    ],
  },
  [AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK]: {
    tags: [],
    markers: [AI_PROMPT_MARKERS.CURRENT_PROGRAM_DEFINITION, AI_PROMPT_MARKERS.LATEST_USER_REQUEST],
  },
  [AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE]: {
    tags: [],
    markers: [],
  },
} as const;
