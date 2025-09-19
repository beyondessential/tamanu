import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { keyBy, mapValues, uniq } from 'lodash';
import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

const applyDefaultsToTranslations = ({
  [DEFAULT_LANGUAGE_CODE]: defaultText,
  [ENGLISH_LANGUAGE_CODE]: enText,
  ...rest
}) => ({
  ...rest,
  [DEFAULT_LANGUAGE_CODE]: defaultText,
  [ENGLISH_LANGUAGE_CODE]: enText || defaultText,
});

export const useTranslationLanguagesQuery = () => {
  const api = useApi();
  return useQuery(['languageList'], () => api.get('public/translation/languageOptions'), {
    select: data => {
      const { languageNames = [], languagesInDb = [], countryCodes = [] } = data;
      const languageDisplayNames = applyDefaultsToTranslations(
        mapValues(keyBy(languageNames, 'language'), 'text'),
      );
      const languageCountryCodes = applyDefaultsToTranslations(
        mapValues(keyBy(countryCodes, 'language'), 'text'),
      );
      const languagesInDbDefaulted = uniq(
        languagesInDb.map(({ language }) =>
          language === DEFAULT_LANGUAGE_CODE ? ENGLISH_LANGUAGE_CODE : language,
        ),
      );

      return { languageDisplayNames, languageCountryCodes, languagesInDb: languagesInDbDefaulted };
    },
  });
};
