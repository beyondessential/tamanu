import React from 'react';
import styled from 'styled-components';
import SearchIcon from '@material-ui/icons/Search';
import Typography from '@material-ui/core/Typography';

import { Button } from './Button';
import { ButtonRow } from './ButtonRow';
import { Form, Field, TextField } from './Field';
import { FormGrid } from './FormGrid';

const Container = styled.div`
  padding: 1rem 2rem 1rem 2rem;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
`;

const HeaderBar = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    font-size: 1rem;
    font-weight: 500;
    color: ${props => props.theme.palette.text.primary};
  }
`;

const PaddedSearchIcon = styled(SearchIcon)`
  padding-right: 3px;
`;

const renderSearchBar = ({ submitForm, clearForm }) => (
  <FormGrid columns={3}>
    <Field name="type" placeholder="Type" component={TextField} />
    <Field name="documentOwner" placeholder="Owner" component={TextField} />
    <Field name="departmentName" placeholder="Department" component={TextField} />
    <ButtonRow>
      <Button onClick={clearForm} variant="outlined" color="primary">
        Clear search
      </Button>
      <Button color="primary" variant="contained" onClick={submitForm} type="submit">
        <PaddedSearchIcon />
        Search
      </Button>
    </ButtonRow>
  </FormGrid>
);

export const DocumentsSearchBar = ({ setSearchParameters, onAddDocument }) => (
  <Container>
    <HeaderBar>
      <Typography variant="h3">Documents search</Typography>
      <Button onClick={onAddDocument} variant="contained" color="primary">
        Add document
      </Button>
    </HeaderBar>
    <Form onSubmit={values => setSearchParameters(values)} render={renderSearchBar} />
  </Container>
);
