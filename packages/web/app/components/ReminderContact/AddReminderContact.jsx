import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { Box, Divider, Typography } from '@material-ui/core';

import { TextField, Form, FormConfirmCancelBackRow } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { LocalisedField, SuggesterSelectField } from '../Field';
import { TranslatedText } from '../Translation/TranslatedText';
import { joinNames } from '../../utils/user';
import { useTranslation } from '../../contexts/Translation';
import { usePatient } from '../../contexts/Patient';
import { useApi } from '../../api';

const FormHeading = styled(Typography)`
  margin: 7px 0 9px 0;
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
`;

const FormSubHeading = styled(Typography)`
  margin: 0;
  font-size: 14px;
  line-height: 18px;

  span {
    font-weight: 500;
  }
`;

const StyledFormContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 38px;

  > div {
    flex: 1;
  }
`;

const StyledFullWidthContainer = styled(Box)`
  margin: 0 -32px 21px;
  grid-column: 1 / -1;
`;

const StyledDivider = styled(Divider)`
  border-top: 1px solid ${Colors.outline};
`;

export const AddReminderContact = ({ onClose, onBack }) => {
  const { getTranslation } = useTranslation();
  const api = useApi();

  const { patient } = usePatient();

  if (!patient) return null;

  const patientName = joinNames(patient);

  const onSubmit = async (values) => {
    const body = {
      name: values.reminderContactName,
      relationshipId: values.reminderContactRelationship,
      patientId: patient.id,
    };

    await api.post(`patient/reminderContact`, body);
    onBack();
  };

  return (
    <Form
      onSubmit={onSubmit}
      validationSchema={yup.object().shape({
        reminderContactName: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="patient.details.addReminderContact.label.contactName"
              fallback="Contact name"
              data-testid="translatedtext-n83s"
            />,
          ),
        reminderContactRelationship: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="patient.details.addReminderContact.label.relationship"
              fallback="Relationship"
              data-testid="translatedtext-4hna"
            />,
          ),
      })}
      render={({ submitForm }) => {
        return (
          <>
            <FormHeading data-testid="formheading-mxsn">
              <TranslatedText
                stringId="patient.details.addReminderContact.heading"
                fallback="Please provide details below to add a new contact."
                data-testid="translatedtext-rlo2"
              />
            </FormHeading>
            <FormSubHeading
              dangerouslySetInnerHTML={{
                __html: getTranslation(
                  'patient.details.addReminderContact.description',
                  'By providing their details, the individual consents to receiving automated reminder messages for :patientName.',
                  { patientName: `<span>${patientName}</span>` },
                ),
              }}
              data-testid="formsubheading-72l1"
            ></FormSubHeading>
            <StyledFormContainer data-testid="styledformcontainer-k7ln">
              <LocalisedField
                name="reminderContactName"
                component={TextField}
                label={
                  <TranslatedText
                    stringId="patient.details.addReminderContact.label.contactName"
                    fallback="Contact name"
                    data-testid="translatedtext-ljbl"
                  />
                }
                placeholder={getTranslation(
                  'patient.details.addReminderContact.placeholder.contactName',
                  'Contact Name',
                )}
                required
                data-testid="localisedfield-ebu2"
              />

              <LocalisedField
                name="reminderContactRelationship"
                component={SuggesterSelectField}
                endpoint="contactRelationship"
                label={
                  <TranslatedText
                    stringId="patient.details.addReminderContact.label.relationship"
                    fallback="Relationship"
                    data-testid="translatedtext-w75a"
                  />
                }
                placeholder={getTranslation(
                  'patient.details.addReminderContact.placeholder.select',
                  'Select',
                )}
                required
                data-testid="localisedfield-2jnt"
              />
            </StyledFormContainer>
            <StyledFullWidthContainer data-testid="styledfullwidthcontainer-o6wk">
              <StyledDivider data-testid="styleddivider-gy3h" />
            </StyledFullWidthContainer>
            <FormConfirmCancelBackRow
              onBack={onBack}
              onConfirm={submitForm}
              onCancel={onClose}
              data-testid="formconfirmcancelbackrow-4y98"
            />
          </>
        );
      }}
      data-testid="form-r9qu"
    />
  );
};
