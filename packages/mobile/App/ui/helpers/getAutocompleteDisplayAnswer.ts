import { AutocompleteSourceToColumnMap } from '~/ui/helpers/constants';

export async function getAutocompleteDisplayAnswer(
  models,
  dataElementId,
  sourceId,
): Promise<string | null> {
  const autocompleteComponent = await models.SurveyScreenComponent.findOne({
    where: {
      dataElement: dataElementId,
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
