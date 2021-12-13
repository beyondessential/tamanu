import React from 'react';
import styled from 'styled-components';
import SearchIcon from '@material-ui/icons/Search';

import { Button } from './Button';
import { ButtonRow } from './ButtonRow';
import { Form, Field, TextField } from './Field';
import { FormGrid } from './FormGrid';

const StyledDiv = styled.div`
  margin: 1rem;
  padding: 16px;
  border: 1px solid #dedede;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
`;

const Label = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.palette.primary.main};
  margin-bottom: 5px;
`;

const PaddedSearchIcon = styled(SearchIcon)`
  padding-right: 3px;
`;

const renderSearchBar = ({ submitForm, clearForm }) => (
  <FormGrid columns={3}>
    <Field name="type" placeholder="Type" component={TextField} />
    <Field name="documentOwner" placeholder="Owner" component={TextField} />
    <Field name="departmentId" placeholder="Department" component={TextField} />
    <ButtonRow>
      <Button color="primary" variant="contained" onClick={submitForm} type="submit">
        <PaddedSearchIcon />
        Search
      </Button>
      <Button onClick={clearForm} variant="outlined">
        Clear search
      </Button>
    </ButtonRow>
  </FormGrid>
);

export const DocumentsSearchBar = ({ setSearchParameters }) => {
  return (
    <StyledDiv>
      <Label>Documents search</Label>
      <Form onSubmit={values => setSearchParameters(values)} render={renderSearchBar} />
    </StyledDiv>
  );
};
