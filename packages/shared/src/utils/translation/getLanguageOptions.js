import { keyBy, mapValues } from 'lodash';

export const getLanguageOptions = async (models, storedEtag) => {
  const { TranslatedString } = models;

  const eTag = await TranslatedString.etagForLanguageOptions();

  if (storedEtag === eTag) {
    return 304;
  }

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

  return { languageOptions, eTag };
};
