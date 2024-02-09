import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../constants';
import { useApi } from '../api';
import { SelectInput } from './Field';

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

export const LanguageSelector = ({ field }) => {
  const api = useApi();

  const isCentralServer = false; // currently only works for facility server. We need to find a way to check on login screen if it's central server or not

  const { data: languageOptions = [], error } = useQuery(['languageList'], () =>
    api.get('public/translation/preLogin', null),
  );

  // If multiple languages not implemented, no need for this component to show
  if (languageOptions.length <= 1) return null;

  return (
    <LanguageSelectorContainer>
      <SelectInput
        options={languageOptions}
        label="Language"
        isClearable={false}
        error={!!error}
        customStyleObject={customStyles}
        {...field}
      />
    </LanguageSelectorContainer>
  );
};
