import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../constants';
import { useApi } from '../api';
import { SelectInput } from './Field';

const LanguageSelectInput = styled(SelectInput)`
  width: 143px;
  .label-field {
    font-family: Roboto;
    font-size: 11px;
    font-weight: 400;
    line-height: 15px;
    letter-spacing: 0px;
    text-align: left;
    color: #888888;
  }
  border-bottom: 0.1px solid ${Colors.primary};
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

export const LanguageSelector = ({ selectedOption, onChange }) => {
  const api = useApi();

  const { data: languageOptions = [], error } = useQuery(['languageList'], () =>
    api.get('translation/preLogin'),
  );

  return (
    <LanguageSelectInput
      value={selectedOption}
      onChange={onChange}
      options={languageOptions}
      label="Language"
      isClearable={false}
      error={!!error}
      customStyleObject={customStyles}
    />
  );
};
