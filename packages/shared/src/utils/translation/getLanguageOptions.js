import { keyBy, mapValues } from 'lodash';

export const getLanguageOptions = async (models) => {
  const { TranslatedString } = models;

  const languagesInDb = await TranslatedString.findAll({
    attributes: ['language'],
    group: 'language',
  });

  const languageNames = await TranslatedString.findAll({
    where: { stringId: 'languageName' },
  });

  const languageDisplayNames = mapValues(keyBy(languageNames, 'language'), 'text');
  const languageOptions = languagesInDb.map(({ language }) => {
    return {
      label: languageDisplayNames[language],
      value: language,
    };
  });

  return { languageOptions };
};
