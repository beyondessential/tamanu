import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import SearchIcon from '@material-ui/icons/Search';
import { Button } from './Button';
import { Form, Field, TextField } from './Field';
import { Colors } from '../constants';

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
  <SearchInputContainer>
    <Field component={TextField} placeholder={placeholder} name="name" />
    <Button color="primary" variant="contained" onClick={submitForm}>
      <PaddedSearchIcon />
      Search
    </Button>
  </SearchInputContainer>
);

export const LocationSearchBar = memo(({ onSearch }) => {
  // We can't use onSearch directly as formik will call it with an unwanted second param
  const handleSearch = useCallback(newParams => onSearch(newParams), [onSearch]);

  return (
    <Container>
      <Form onSubmit={handleSearch} render={renderSearchBar} />
    </Container>
  );
});
