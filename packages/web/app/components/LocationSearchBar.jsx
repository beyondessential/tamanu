import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import SearchIcon from '@material-ui/icons/Search';
import { TextField, Form, FormSubmitButton } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { Field } from './Field';
import { TranslatedText } from './Translation/TranslatedText';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const SearchInputContainer = styled.div`
  display: grid;
  grid-template-columns: auto 150px;
  padding: 24px;

  .MuiInputBase-input {
    padding-top: 16px;
    padding-bottom: 16px;
  }

  fieldset {
    border-radius: 0;
    border-right: none;
  }

  > :first-child {
    fieldset {
      border-radius: 4px 0 0 4px;
    }
  }

  button {
    border-radius: 0;
  }

  :last-child {
    button {
      border-radius: 0 4px 4px 0;
    }
  }
`;

const PaddedSearchIcon = styled(SearchIcon)`
  padding-right: 3px;
`;

const renderSearchBar = ({ placeholder, submitForm }) => (
  <SearchInputContainer data-testid="searchinputcontainer-p9q0">
    <Field component={TextField} placeholder={placeholder} name="name" data-testid="field-gf6j" />
    <FormSubmitButton
      color="primary"
      variant="contained"
      onClick={submitForm}
      data-testid="formsubmitbutton-zef2"
    >
      <PaddedSearchIcon data-testid="paddedsearchicon-5bb7" />
      <TranslatedText
        stringId="general.action.search"
        fallback="Search"
        data-testid="translatedtext-search"
      />
    </FormSubmitButton>
  </SearchInputContainer>
);

export const LocationSearchBar = memo(({ onSearch }) => {
  // We can't use onSearch directly as formik will call it with an unwanted second param
  const handleSearch = useCallback(newParams => onSearch(newParams), [onSearch]);

  return (
    <Container data-testid="container-jjro">
      <Form onSubmit={handleSearch} render={renderSearchBar} data-testid="form-8yoa" />
    </Container>
  );
});
