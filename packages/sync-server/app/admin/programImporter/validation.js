import { VITALS_DATA_ELEMENT_IDS, SURVEY_TYPES, CURRENTLY_AT_TYPES } from '@tamanu/constants';
import { ValidationError } from '../errors';
import { statkey, updateStat } from '../stats';

const REQUIRED_QUESTION_IDS = {
  [SURVEY_TYPES.VITALS]: Object.values(VITALS_DATA_ELEMENT_IDS),
};

export function ensureRequiredQuestionsPresent(surveyInfo, questionRecords) {
  const { surveyType, sheetName } = surveyInfo;

  const requiredQuestions = REQUIRED_QUESTION_IDS[surveyType];
  if (!requiredQuestions) {
    return;
  }

  // check that each mandatory question ID has a corresponding row in the import sheet
  const hasQuestion = id => questionRecords.some(q => q.values.id === id);
  const missingQuestions = requiredQuestions.filter(rf => !hasQuestion(rf));
  if (missingQuestions.length > 0) {
    throw new ValidationError(
      sheetName,
      -2,
      `Survey missing required questions: ${missingQuestions.join(', ')}`,
    );
  }
}

export async function validateCurrentlyAtQuestionsCorrectType(context, surveyInfo, questionRecords) {
  const { programId, sheetName } = surveyInfo;

  // TODO: why not Program.hasOne(ProgramRegistry)
  const programRegistry = await context.models.ProgramRegistry.findOne({
    where: {
      programId,
      // Shouldn't be able to accidentally hack around the check with a historical registry
      // visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });
  if (!programRegistry) return;

  const forbiddenFieldName =
    programRegistry.currentlyAtType === CURRENTLY_AT_TYPES.VILLAGE
      ? 'registrationCurrentlyAtFacility'
      : 'registrationCurrentlyAtVillage';

  const newErrors = questionRecords
    .filter(({ model }) => model === 'SurveyScreenComponent')
    .map(record => ({ ...record, config: JSON.parse(record.values.config) }))
    // The correct format for the config will be validated later, just ignore them for now
    .filter(config => config?.writeToPatient?.fieldName)
    .filter(config => config.writeToPatient.fieldName === forbiddenFieldName)
    .map(
      ({ sheetRow }) =>
        new ValidationError(
          sheetName,
          sheetRow,
          `Error in config.fieldName: fieldName=${forbiddenFieldName} but program registry configured for ${programRegistry.currentlyAtType}`,
        ),
    );

  // Don't throw an error here so that validation can continue
  // Note this means that errored stats might double count
  // these rows if they have another problem as well
  if (newErrors.length > 0) {
    updateStat(
      context.stats,
      statkey('SurveyScreenComponent', sheetName),
      'errored',
      newErrors.length,
    );
    context.errors.push(newErrors);
  }
}
