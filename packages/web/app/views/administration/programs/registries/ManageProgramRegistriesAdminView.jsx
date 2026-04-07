import React from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';

import { Field, Form, SelectField, TranslatedText } from '@tamanu/ui-components';
import { useAdminProgramRegistriesQuery } from './useAdminProgramRegistriesQuery';
import { ContentContainer } from '../../components/AdminViewContainer';

export const Article = styled.article`
  overflow: auto;
  padding-block: 26px;
  padding-inline: 30px;
  ${ContentContainer}:has(&) {
    background-color: #f7f9fb;
  }
`;

export function ManageProgramRegistriesAdminView() {
  const { data } = useAdminProgramRegistriesQuery();
  const options = data?.map(({ id, name }) => ({ value: id, label: name }));

  const navigate = useNavigate();

  const renderForm = () => (
    <Field
      component={SelectField}
      options={options}
      name="programRegistryId"
      label={
        <TranslatedText
          stringId="admin.program-registry.select.label"
          fallback="Select program registry"
        />
      }
    />
  );

  return (
    <Article>
      <header>
        <Form
          render={renderForm}
          onSubmit={values => navigate(encodeURIComponent(values.programRegistryId))}
        />
      </header>
    </Article>
  );
}
