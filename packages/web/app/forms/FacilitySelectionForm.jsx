import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';
import { FormGrid } from '../components/FormGrid';
import {
  BodyText,
  Field,
  Form,
  FormSubmitButton,
  FormCancelButton,
  AutocompleteField,
  ButtonRow,
} from '../components';
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

const StyledButtonRow = styled(ButtonRow)`
  font-size: 14px;
  line-height: 18px;
  margin-top: 15px;
`;

const SubmitButton = styled(FormSubmitButton)`
  flex: 1;
`;

const CancelButton = styled(FormCancelButton)`
  margin-left: 0 !important;
`;

const FacilitySelectionFormComponent = ({ options, errorMessage, onCancel }) => {
  return (
    <FormGrid columns={1}>
      <div>
        <Heading>
          <TranslatedText
            stringId="auth.facility.heading"
            fallback="Select facility"
            data-testid='translatedtext-bpl2' />
        </Heading>
        {!!errorMessage && <FormSubtext>{errorMessage}</FormSubtext>}
      </div>
      <Field
        name="facilityId"
        label={
          <TranslatedText
            stringId="general.localisedField.facility.label"
            fallback="Facility"
            data-testid='translatedtext-wqd0' />
        }
        component={AutocompleteField}
        options={options}
        required
        data-testid='field-bbwr' />
      <StyledButtonRow>
        <CancelButton onClick={onCancel}>
          {<TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid='translatedtext-0fka' />}
        </CancelButton>
        <SubmitButton
          text={<TranslatedText
            stringId="general.action.submit"
            fallback="Submit"
            data-testid='translatedtext-81ha' />}
        />
      </StyledButtonRow>
      <LanguageSelector />
    </FormGrid>
  );
};

export const FacilitySelectionForm = React.memo(
  ({ facilities, onSubmit, onCancel, errorMessage }) => {
    const options = facilities.map(facility => ({
      value: facility.id,
      label: facility.name,
    }));
    const renderForm = ({ setFieldValue, setFieldError }) => (
      <FacilitySelectionFormComponent
        options={options}
        errorMessage={errorMessage}
        setFieldValue={setFieldValue}
        setFieldError={setFieldError}
        onCancel={onCancel}
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
            .translatedLabel(
              <TranslatedText
                stringId="general.localisedField.facility.label"
                fallback="Facility"
                data-testid='translatedtext-pv04' />,
            ),
        })}
      />
    );
  },
);
