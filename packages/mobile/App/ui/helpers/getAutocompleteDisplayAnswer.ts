import { AutocompleteSourceToColumnMap } from '~/ui/helpers/constants';
import { MODELS_MAP } from '~/models/modelsMap';

export async function getAutocompleteDisplayAnswer(
  models: typeof MODELS_MAP,
  dataElementId: string,
  sourceId: string,
): Promise<string | null> {
  const autocompleteComponent = await models.SurveyScreenComponent.findOne({
    where: {
      dataElement: dataElementId,
      visibilityStatus: null,
    },
  });
  const autocompleteConfig = autocompleteComponent?.getConfigObject();

  if (autocompleteConfig) {
    const fullLinkedAnswer = await models[autocompleteConfig.source]
      .getRepository()
      .findOne(sourceId);
    const columnToDisplay = AutocompleteSourceToColumnMap[autocompleteConfig.source];
    return fullLinkedAnswer[columnToDisplay];
  }

  return null;
}
