import { MODELS_MAP } from '~/models/modelsMap';
import { getDisplayNameForModel } from './fields';

export async function getAutocompleteDisplayAnswer(
  models: typeof MODELS_MAP,
  dataElementId: string,
  sourceId: string,
): Promise<string | null> {
  let autocompleteComponent = null;

  try {
    autocompleteComponent = await models.SurveyScreenComponent.findOne({
      where: {
        dataElement: dataElementId,
      },
      withDeleted: true,
    });
  } catch (e) {
    console.log('Cannot find autocomplete component', e);
  }

  const autocompleteConfig = autocompleteComponent?.getConfigObject();

  if (autocompleteConfig) {
    const fullLinkedAnswer = await models[autocompleteConfig.source]
      .getRepository()
      .findOne(sourceId);
    return getDisplayNameForModel(autocompleteConfig.source, fullLinkedAnswer);
  }

  return null;
}
