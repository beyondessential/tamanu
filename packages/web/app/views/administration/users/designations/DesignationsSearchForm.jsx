import React from 'react';
import { useSearchParams } from 'react-router';

import { FORM_TYPES } from '@tamanu/constants/forms';
import { FormSubmitButton, TextField } from '@tamanu/ui-components';
import { useSuggester } from '../../../../api';
import { TranslatedText } from '../../../../components';
import { AutocompleteField, Field } from '../../../../components/Field';
import { useTranslation } from '../../../../contexts/Translation';
import { ButtonGroup, Search, SearchClearButton, StyledForm } from '../components';

const suggesterOptions = { formatter: ({ id }) => ({ label: id, value: id }) }; // Format ID as label and value

export const DesignationsSearchForm = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idQuery = searchParams.get('id');
  const nameQuery = searchParams.get('name');

  const { getTranslation } = useTranslation();

  const designationSuggester = useSuggester('designation', suggesterOptions);

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
        placeholder={getTranslation('general.placeholder.search...', 'Search…')}
      />
      <Field
        component={AutocompleteField}
        label={<TranslatedText stringId="admin.designations.id.label" fallback="ID" />}
        name="id"
        placeholder={getTranslation('general.placeholder.select', 'Select')}
        suggester={designationSuggester}
      />
      <ButtonGroup>
        <FormSubmitButton color="primary" onClick={submitForm}>
          <TranslatedText stringId="general.action.search" fallback="Search" />
        </FormSubmitButton>
        <SearchClearButton onClick={onClear} />
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
