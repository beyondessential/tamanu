import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';
import { FormGrid } from '../components/FormGrid';
import { BodyText, Field, Form, FormSubmitButton, AutocompleteField } from '../components';
import { Colors } from '../constants';
import { LanguageSelector } from '../components/LanguageSelector';
import { TranslatedText } from '../components/Translation/TranslatedText';

const FormSubtext = styled(BodyText)`
  color: ${Colors.midText};
  padding: 10px 0;
`;

const Heading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
`;

const SubmitButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 14px 0;
  margin-top: 15px;
`;

const FacilitySelectionFormComponent = ({ facilities, errorMessage }) => {
  return (
    <FormGrid columns={1}>
      <div>
        <Heading>
          <TranslatedText stringId="auth.facility.heading" fallback="Select facility" />
        </Heading>
        {!!errorMessage && <FormSubtext>{errorMessage}</FormSubtext>}
      </div>
      <Field
        name="facilityId"
        label={<TranslatedText stringId="auth.facility.label" fallback="Facility" />}
        component={AutocompleteField}
        options={facilities}
        required
      />
      <SubmitButton text={<TranslatedText stringId="auth.facility.submit" fallback="Submit" />} />
      <LanguageSelector />
    </FormGrid>
  );
};

export const FacilitySelectionForm = React.memo(({ facilities, onSubmit, errorMessage }) => {
  const renderForm = ({ setFieldValue, setFieldError }) => (
    <FacilitySelectionFormComponent
      facilities={facilities}
      errorMessage={errorMessage}
      setFieldValue={setFieldValue}
      setFieldError={setFieldError}
    />
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      validationSchema={yup.object().shape({
        facilityId: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="auth.facility.label" fallback="Facility" />),
      })}
    />
  );
});
