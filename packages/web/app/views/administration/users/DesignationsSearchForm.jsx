import React from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';

import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormSubmitButton, TextField } from '@tamanu/ui-components';
import { useSuggester } from '../../../api';
import { Button, TranslatedText } from '../../../components';
import { AutocompleteField, Field } from '../../../components/Field';
import { useTranslation } from '../../../contexts/Translation';

const Search = styled('search')`
  display: contents;
  gap: inherit;
`;

const StyledForm = styled(Form)`
  display: grid;
  gap: inherit;
  grid-template-columns: repeat(auto-fill, minmax(min(19.375rem, 100%), 1fr));
`;

const ButtonGroup = styled.div`
  align-items: flex-end;
  display: flex;
  font-size: 0.875rem;
  gap: inherit;
  button {
    font-size: inherit;
  }
`;

export const DesignationsSearchForm = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idQuery = searchParams.get('id');
  const nameQuery = searchParams.get('name');

  const { getTranslation } = useTranslation();
  const placeholder = getTranslation('general.action.search...', 'Search…');

  const designationSuggester = useSuggester('designation', {
    formatter: ({ id }) => ({ label: id, value: id }),
  });

  const onSubmit = values => {
    const name = values.name?.trim();
    const id = values.id?.trim();
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);

        if (id) next.set('id', id);
        else next.delete('id');

        if (name) next.set('name', name);
        else next.delete('name');

        return next;
      },
      { replace: true },
    );
  };

  const onClear = () => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        next.delete('name');
        return next;
      },
      { replace: true },
    );
  };

  const render = ({ submitForm }) => (
    <>
      <Field
        component={TextField}
        label={<TranslatedText stringId="admin.designations.name.label" fallback="Name" />}
        name="name"
        placeholder={placeholder}
      />
      <Field
        component={AutocompleteField}
        label={<TranslatedText stringId="admin.designations.id.label" fallback="ID" />}
        name="id"
        placeholder={placeholder}
        suggester={designationSuggester}
      />
      <ButtonGroup>
        <FormSubmitButton color="primary" onClick={submitForm}>
          <TranslatedText stringId="general.action.search" fallback="Search" />
        </FormSubmitButton>
        <Button onClick={onClear} variant="text">
          <TranslatedText stringId="general.action.clear" fallback="Clear" />
        </Button>
      </ButtonGroup>
    </>
  );

  return (
    <Search>
      <StyledForm
        formType={FORM_TYPES.SEARCH_FORM}
        initialValues={{ id: idQuery, name: nameQuery }}
        key={`id=${idQuery ?? ''}&name=${nameQuery ?? ''}`}
        onSubmit={onSubmit}
        render={render}
      />
    </Search>
  );
};
