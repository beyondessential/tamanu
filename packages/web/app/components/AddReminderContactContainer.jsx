import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { Box, Divider, Typography } from '@material-ui/core';

import { Colors, REMINDER_CONTACT_VIEWS } from '../constants';
import { FormConfirmCancelBackRow } from './ButtonRow';
import { Field, Form, SelectField } from './Field';

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

const REQUIRED_VALIDATION_MESSAGE = '*Required';

const AddReminderForm = ({
  patient,
  onSubmitAddReminderForm,
  handleCloseRemindersModal,
  handleBackReminderModel,
}) => {
  const relationshipArray = [
    {
      label: 'Son',
      value: 'son',
    },
    {
      label: 'Father',
      value: 'father',
    },
  ];

  return (
    <>
      <Form
        onSubmit={onSubmitAddReminderForm}
        initialValues={{ contactName: 'test', relationship: 'son' }}
        validationSchema={yup.object().shape({
          contactName: yup.string().required(REQUIRED_VALIDATION_MESSAGE),
          relationship: yup.string().required(REQUIRED_VALIDATION_MESSAGE),
        })}
        suppressErrorDialog
        render={({ submitForm }) => {
          return (
            <>
              <FormHeading>Please provide details below to add a new contact.</FormHeading>
              <FormSubHeading>
                By providing their details, the individual consents to receiving automated reminder
                messages for{' '}
                <span>
                  {patient.firstName} {patient.lastName}
                </span>
              </FormSubHeading>
              <StyledFormContainer>
                <Field
                  name="contactName"
                  label="Contact name"
                  type="text"
                  placeholder="Enter contact name"
                  autoComplete="off"
                  required
                />

                <Field
                  name="relationship"
                  label="Relationship"
                  component={SelectField}
                  placeholder="Select relationship"
                  options={relationshipArray}
                  required
                />
              </StyledFormContainer>

              <FormFooterText>Connect using the QR code on the following screen.</FormFooterText>
              <StyledFullWidthContainer>
                <StyledDivider />
              </StyledFullWidthContainer>
              <FormConfirmCancelBackRow
                onBack={handleBackReminderModel}
                onConfirm={submitForm}
                onCancel={handleCloseRemindersModal}
                confirmText="Confirm & connect"
              />
            </>
          );
        }}
      />
    </>
  );
};

export const AddReminderContactContainer = ({
  handleCloseRemindersModal,
  handleActiveView,
  patient,
}) => {
  const onSubmitAddReminderForm = async data => {
    handleActiveView(REMINDER_CONTACT_VIEWS.ADD_REMINDER_QR_CODE);
    await console.log(data);
  };

  const handleBackReminderModel = () => {
    handleActiveView(REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST);
  };

  return (
    <AddReminderForm
      patient={patient}
      handleBackReminderModel={handleBackReminderModel}
      onSubmitAddReminderForm={onSubmitAddReminderForm}
      handleCloseRemindersModal={handleCloseRemindersModal}
    ></AddReminderForm>
  );
};
