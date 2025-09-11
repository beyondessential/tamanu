import React from 'react';
import styled from 'styled-components';
import { useTranslationLanguagesQuery } from '../api/queries';
import { SelectInput, TAMANU_COLORS } from '@tamanu/ui-components';
import { useTranslation } from '../contexts/Translation.jsx';
import { TranslatedText } from './Translation/TranslatedText.jsx';
import { mapValues, keyBy } from 'lodash';
import { ReactCountryFlag } from 'react-country-flag';
import { isISO31661Alpha2 } from 'validator';

const LanguageSelectorContainer = styled.div`
  position: absolute;
  bottom: 35px;
  right: 17px;
  border-bottom: 0.1px solid ${TAMANU_COLORS.primary};
  width: 143px;
  .label-field {
    font-size: 11px;
    font-weight: 400;
    line-height: 15px;
    color: ${TAMANU_COLORS.midText};
  }
`;

const LanguageOptionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const customStyles = {
  control: (provided) => ({
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
  menu: (provided) => ({
    ...provided,
    marginTop: 5,
    marginBottom: 0,
    boxShadow: 'none',
    borderWidth: '1px',
    border: `1px solid ${TAMANU_COLORS.primary}`,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused || state.isSelected ? TAMANU_COLORS.hoverGrey : TAMANU_COLORS.white,
    ...(state.isDisabled ? {} : { color: TAMANU_COLORS.darkestText }),
    cursor: 'pointer',
    fontSize: '11px',
  }),
};

export const LanguageSelector = () => {
  const { updateStoredLanguage, storedLanguage } = useTranslation();
  const { data = {}, error } = useTranslationLanguagesQuery();

  const { languageNames = [], languagesInDb = [], countryCodes = [] } = data;

  const languageDisplayNames = mapValues(keyBy(languageNames, 'language'), 'text');
  const languageCountryCodes = mapValues(keyBy(countryCodes, 'language'), 'text');
  const languageOptions = languagesInDb.map(({ language }) => {
    const countryCode = languageCountryCodes[language];
    return {
      label: (
        <LanguageOptionLabel data-testid={`languageoptionlabel-lxsu-${language}`}>
          {countryCode && isISO31661Alpha2(countryCode) && (
            <ReactCountryFlag countryCode={countryCode} style={{ width: '22px' }} svg />
          )}
          {languageDisplayNames[language]}
        </LanguageOptionLabel>
      ),
      value: language,
    };
  });

  // If multiple languages not implemented, no need for this component to show
  if (languageOptions.length <= 1) return null;

  const handleLanguageChange = (event) => {
    updateStoredLanguage(event.target.value);
  };

  return (
    <LanguageSelectorContainer data-testid="languageselectorcontainer-1xer">
      <SelectInput
        options={languageOptions}
        label={
          <TranslatedText
            stringId="login.languageSelector.label"
            fallback="Language"
            data-testid="translatedtext-3qat"
          />
        }
        isClearable={false}
        error={!!error}
        customStyleObject={customStyles}
        name="Language"
        value={storedLanguage}
        onChange={handleLanguageChange}
        data-testid="selectinput-2jq3"
      />
    </LanguageSelectorContainer>
  );
};
