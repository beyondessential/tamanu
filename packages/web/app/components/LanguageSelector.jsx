import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';
import { useTranslationLanguages } from '../api/queries';
import { SelectInput } from './Field';
import { useTranslation } from '../contexts/Translation.jsx';
import { TranslatedText } from './Translation/TranslatedText.jsx';
import { mapValues, keyBy } from 'lodash';

const LanguageSelectorContainer = styled.div`
  position: absolute;
  bottom: 35px;
  right: 17px;
  border-bottom: 0.1px solid ${Colors.primary};
  width: 143px;
  .label-field {
    font-size: 11px;
    font-weight: 400;
    line-height: 15px;
    color: ${Colors.midText}};
  }
`;

const customStyles = {
  control: provided => ({
    ...provided,
    '&:hover': {
      borderColor: 'transparent',
    },
    borderColor: 'transparent',
    borderRadius: 0,
    boxShadow: 'none',
    cursor: 'pointer',
    fontSize: '11px',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: provided => ({
    ...provided,
    marginTop: 5,
    marginBottom: 0,
    boxShadow: 'none',
    borderWidth: '1px',
    border: `1px solid ${Colors.primary}`,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused || state.isSelected ? Colors.hoverGrey : Colors.white,
    ...(state.isDisabled ? {} : { color: Colors.darkestText }),
    cursor: 'pointer',
    fontSize: '11px',
  }),
};

export const LanguageSelector = () => {
  const { updateStoredLanguage, storedLanguage } = useTranslation();
  const { data = {}, error } = useTranslationLanguages();

  const { languageNames = [], languagesInDb = [] } = data;

  const languageDisplayNames = mapValues(keyBy(languageNames, 'language'), 'text');
  const languageOptions = languagesInDb.map(({ language }) => {
    return {
      label: languageDisplayNames[language],
      value: language,
    };
  });

  // If multiple languages not implemented, no need for this component to show
  if (languageOptions.length <= 1) return null;

  const handleLanguageChange = event => {
    updateStoredLanguage(event.target.value);
  };

  return (
    <LanguageSelectorContainer>
      <SelectInput
        options={languageOptions}
        label={<TranslatedText stringId="login.languageSelector.label" fallback="Language" />}
        isClearable={false}
        error={!!error}
        customStyleObject={customStyles}
        name="Language"
        value={storedLanguage}
        onChange={handleLanguageChange}
      />
    </LanguageSelectorContainer>
  );
};
