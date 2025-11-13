import React from 'react';
import styled from 'styled-components';
import { Box } from '@mui/material';
import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  Form,
  FormCancelButton,
  FormSubmitButton,
  BaseModal,
  TranslatedText,
} from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { MedicationSummary } from './MedicationSummary';
import { useEncounter } from '../../contexts/Encounter';

const StyledBaseModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const DarkText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkText};
`;

const StyledFormActions = styled(Box)`
  margin: 0 -32px -12px;
  padding: 20px 40px 0;
  border-top: 1px solid ${Colors.outline};
  display: flex;
  justify-content: flex-end;
  gap: 16px;
`;

export const MedicationResumeModal = ({ medication, onResume, onClose }) => {
  const { encounter } = useEncounter();
  const api = useApi();

  const onSubmit = async data => {
    await api.post(`medication/${medication.id}/resume`, data);
    onResume();
    onClose();
  };

  return (
    <StyledBaseModal
      open
      onClose={onClose}
      title={
        <TranslatedText stringId="medication.resumeModal.title" fallback="Resume medication" />
      }
    >
      <Form
        suppressErrorDialog
        onSubmit={onSubmit}
        onSuccess={onClose}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{
          encounterId: encounter.id,
        }}
        render={({ submitForm }) => (
          <>
            <Box px={1} pt={2.75} pb={2.5}>
              <DarkText>
                <TranslatedText
                  stringId="medication.resumeModal.description"
                  fallback="Please confirm you would like to resume the medication below."
                />
              </DarkText>
              <MedicationSummary medication={medication} />
            </Box>
            <StyledFormActions>
              <FormCancelButton onClick={onClose}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </FormCancelButton>
              <FormSubmitButton
                color="primary"
                onClick={data => {
                  submitForm(data);
                }}
              >
                <TranslatedText stringId="medication.details.resume" fallback="Resume" />
              </FormSubmitButton>
            </StyledFormActions>
          </>
        )}
      />
    </StyledBaseModal>
  );
};
