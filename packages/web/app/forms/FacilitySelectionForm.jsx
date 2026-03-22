import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';
import {
  Form,
  ButtonRow,
  FormGrid,
  FormSubmitButton,
  FormCancelButton,
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import {
  BodyText,
  Field,
  AutocompleteField,
} from '../components';
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
    <FormGrid columns={1} data-testid="formgrid-md30">
      <div>
        <Heading data-testid="heading-uped">
          <TranslatedText
            stringId="auth.facility.heading"
            fallback="Select facility"
            data-testid="translatedtext-orcl"
          />
        </Heading>
        {!!errorMessage && <FormSubtext data-testid="formsubtext-5pdt">{errorMessage}</FormSubtext>}
      </div>
      <Field
        name="facilityId"
        label={
          <TranslatedText
            stringId="general.localisedField.facility.label"
            fallback="Facility"
            data-testid="translatedtext-d2hs"
          />
        }
        component={AutocompleteField}
        options={options}
        required
        data-testid="field-zg02"
      />
      <StyledButtonRow data-testid="styledbuttonrow-rz4h">
        <CancelButton onClick={onCancel} data-testid="cancelbutton-hvqq">
          {
            <TranslatedText
              stringId="general.action.cancel"
              fallback="Cancel"
              data-testid="translatedtext-b298"
            />
          }
        </CancelButton>
        <SubmitButton
          text={
            <TranslatedText
              stringId="general.action.submit"
              fallback="Submit"
              data-testid="translatedtext-acp7"
            />
          }
          data-testid="submitbutton-sqih"
        />
      </StyledButtonRow>
      <LanguageSelector data-testid="languageselector-srfq" />
    </FormGrid>
  );
};

export const FacilitySelectionForm = React.memo(
  ({ facilities, onSubmit, onCancel, errorMessage }) => {
    const options = facilities.map((facility) => ({
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
        data-testid="facilityselectionformcomponent-aw2f"
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
                data-testid="translatedtext-fgjr"
              />,
            ),
        })}
        data-testid="form-imgu"
      />
    );
  },
);
