import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../constants';
import { useApi } from '../api';
import { SelectInput } from './Field';

const LanguageSelectorContainer = styled.div`
  position: absolute;
  bottom: 17px;
  left: 17px;
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

export const LanguageSelector = ({ setFieldValue }) => {
  const api = useApi();
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const onChangeLanguage = event => {
    setSelectedLanguage(event.target.value);
    setFieldValue('language', event.target.value);
  };

  const storedHost = localStorage.getItem('host') || null;

  const { data: languageOptions = [], error } = useQuery(
    ['languageList'],
    () => api.get('translation/preLogin'),
    {
      enabled: !!storedHost,
    },
  );

  const storedLanguage = localStorage.getItem('language') || null;

  const localeLanguageCode = navigator.language;
  const isLocaleLanguageCodeInOptions = languageOptions.some(
    ({ value }) => value === localeLanguageCode,
  );
  const genericLanguageCode = localeLanguageCode.split('-')[0];
  const isGenericLanguageCodeInOptions = languageOptions.some(
    ({ value }) => value === genericLanguageCode,
  );

  const initialLanguage =
    storedLanguage ||
    (isLocaleLanguageCodeInOptions && localeLanguageCode) ||
    (isGenericLanguageCodeInOptions && genericLanguageCode) ||
    'en';

  useEffect(() => {
    setFieldValue('language', initialLanguage);
    setSelectedLanguage(initialLanguage);
  }, [setFieldValue, initialLanguage]);

  // If multiple languages not implemented, no need for this component to show
  if (languageOptions.length <= 1) return null;

  return (
    <LanguageSelectorContainer>
      <SelectInput
        value={selectedLanguage}
        onChange={onChangeLanguage}
        options={languageOptions}
        label="Language"
        name="languageCode"
        isClearable={false}
        error={!!error}
        customStyleObject={customStyles}
      />
    </LanguageSelectorContainer>
  );
};
