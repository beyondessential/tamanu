import React, { useState } from 'react';
import styled from 'styled-components';
import { isISO31661Alpha2 } from 'validator';
import { ReactCountryFlag } from 'react-country-flag';
import {
  Modal,
  SelectInput,
  useTranslation,
  TranslatedText,
} from '@tamanu/ui-components';
import { useTranslationLanguagesQuery } from '../api/queries';
import { ModalActionRow } from './ModalActionRow';
import { Colors } from '../constants';

const LanguageSelectorContainer = styled.div`
  margin: 10px auto 50px;
  max-width: 300px;
  .label-field {
    font-size: 14px;
    font-weight: 500;
    line-height: 18px;
    color: ${Colors.midText};
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
    backgroundColor:
      state.isFocused || state.isSelected ? Colors.hoverGrey : Colors.white,
    ...(state.isDisabled ? {} : { color: Colors.darkestText }),
    cursor: 'pointer',
    fontSize: '11px',
  }),
};

export const ChangeLanguageModal = ({ open, onClose, ...props }) => {
  const { updateStoredLanguage, storedLanguage } = useTranslation();
  const [language, setLanguage] = useState(storedLanguage);
  const { data = {}, error } = useTranslationLanguagesQuery();

  const { languageDisplayNames, languageCountryCodes, languagesInDb = [] } = data;

  const languageOptions = languagesInDb.map(language => {
    const countryCode = languageCountryCodes[language];
    return {
      label: (
        <LanguageOptionLabel data-testid={`languageoptionlabel-99kx-${language}`}>
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
      title={
        <TranslatedText
          stringId="general.language.change"
          fallback="Change language"
          data-testid="translatedtext-0de4"
        />
      }
      open={open}
      onClose={onClose}
      {...props}
      data-testid="modal-b06c"
    >
      <LanguageSelectorContainer data-testid="languageselectorcontainer-2x22">
        <SelectInput
          options={languageOptions}
          label={
            <TranslatedText
              stringId="login.languageSelector.label"
              fallback="Language"
              data-testid="translatedtext-upsy"
            />
          }
          isClearable={false}
          error={!!error}
          customStyleObject={customStyles}
          name="Language"
          value={language}
          onChange={handleLanguageChange}
          data-testid="selectinput-9ajj"
        />
      </LanguageSelectorContainer>
      <ModalActionRow
        confirmText="Confirm"
        onConfirm={onConfirmLanguageChange}
        onCancel={onClose}
        cancelText="Cancel"
        data-testid="modalactionrow-x0mn"
      />
    </Modal>
  );
};
