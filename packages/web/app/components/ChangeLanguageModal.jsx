import React, { useState } from 'react';
import { Modal, ModalActionRow } from '.';
import styled from 'styled-components';
import { Colors } from '../constants';
import { useTranslationLanguagesQuery } from '../api/queries';
import { SelectInput } from './Field';
import { useTranslation } from '../contexts/Translation.jsx';
import { TranslatedText } from './Translation/TranslatedText.jsx';
import { mapValues, keyBy } from 'lodash';
import { ReactCountryFlag } from 'react-country-flag';
import { isISO31661Alpha2 } from 'validator';

const LanguageSelectorContainer = styled.div`
  margin: 10px auto 50px;
  max-width: 300px;
  .label-field {
    font-size: 14px;
    font-weight: 500;
    line-height: 18px;
    color: ${Colors.midText}};
  }
`;

const LanguageOptionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    '&:hover': {
      borderColor: Colors.primary,
    },
    border: `1px solid ${Colors.outline}`,
    borderRadius: '4px',
    boxShadow: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    ...(state.isSelected && { borderColor: Colors.primary }),
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

export const ChangeLanguageModal = ({ open, onClose, ...props }) => {
  const { updateStoredLanguage, storedLanguage } = useTranslation();
  const [language, setLanguage] = useState(storedLanguage);
  const { data = {}, error } = useTranslationLanguagesQuery();

  const { languageNames = [], languagesInDb = [], countryCodes = [] } = data;

  const languageDisplayNames = mapValues(keyBy(languageNames, 'language'), 'text');
  const languageCountryCodes = mapValues(keyBy(countryCodes, 'language'), 'text');

  const languageOptions = languagesInDb.map(({ language }) => {
    const countryCode = languageCountryCodes[language];
    return {
      label: (
        <LanguageOptionLabel>
          {countryCode && isISO31661Alpha2(countryCode) && (
            <ReactCountryFlag countryCode={countryCode} style={{ width: '22px' }} svg />
          )}
          {languageDisplayNames[language]}
        </LanguageOptionLabel>
      ),
      value: language,
    };
  });

  const handleLanguageChange = event => {
    setLanguage(event.target.value);
  };

  const onConfirmLanguageChange = () => {
    updateStoredLanguage(language);
    onClose();
  };

  return (
    <Modal
      title={<TranslatedText
        stringId="general.language.change"
        fallback="Change language"
        data-test-id='translatedtext-qusx' />}
      open={open}
      onClose={onClose}
      {...props}
    >
      <LanguageSelectorContainer>
        <SelectInput
          options={languageOptions}
          label={<TranslatedText
            stringId="login.languageSelector.label"
            fallback="Language"
            data-test-id='translatedtext-y1rd' />}
          isClearable={false}
          error={!!error}
          customStyleObject={customStyles}
          name="Language"
          value={language}
          onChange={handleLanguageChange}
        />
      </LanguageSelectorContainer>
      <ModalActionRow
        confirmText="Confirm"
        onConfirm={onConfirmLanguageChange}
        onCancel={onClose}
        cancelText="Cancel"
      />
    </Modal>
  );
};
