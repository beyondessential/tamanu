import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import * as yup from 'yup';

import { Box, Divider, Typography } from '@material-ui/core';

import { TextField, Form, FormConfirmCancelBackRow } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { LocalisedField, SuggesterSelectField } from '../Field';
import { TranslatedText } from '../Translation/TranslatedText';
import { joinNames } from '../../utils/user';
import { useTranslation } from '../../contexts/Translation';
import { useApi } from '../../api';
import { PATIENT_COMMUNICATION_CHANNELS } from '@tamanu/constants';

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

const FormFooterText = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  margin-bottom: 31px;
  font-weight: 500;
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

export const AddReminderContact = ({ onContinue, onClose, onBack }) => {
  const { getTranslation } = useTranslation();
  const api = useApi();

  const patient = useSelector((state) => state.patient);

  const patientName = joinNames(patient);

  const onSubmit = async (values) => {
    const body = {
      name: values.reminderContactName,
      relationshipId: values.reminderContactRelationship,
      method: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
      patientId: patient.id,
    };

    const newContact = await api.post(`/patient/reminderContact`, body);
    onContinue(newContact);
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
            <FormFooterText data-testid="formfootertext-6chs">
              <TranslatedText
                stringId="patient.details.addReminderContact.qrCodeInstruction"
                fallback="Connect using the QR code on the following screen."
                data-testid="translatedtext-5mbe"
              />
            </FormFooterText>
            <StyledFullWidthContainer data-testid="styledfullwidthcontainer-o6wk">
              <StyledDivider data-testid="styleddivider-gy3h" />
            </StyledFullWidthContainer>
            <FormConfirmCancelBackRow
              onBack={onBack}
              onConfirm={submitForm}
              onCancel={onClose}
              confirmText={
                <TranslatedText
                  stringId="patient.details.addReminderContact.action.confirm"
                  fallback="Confirm & connect"
                  data-testid="translatedtext-1c51"
                />
              }
              data-testid="formconfirmcancelbackrow-4y98"
            />
          </>
        );
      }}
      data-testid="form-r9qu"
    />
  );
};
