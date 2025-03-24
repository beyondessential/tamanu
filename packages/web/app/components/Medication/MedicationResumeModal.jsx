import React from 'react';
import styled from 'styled-components';
import { Box } from '@mui/material';

import { BaseModal, Form, FormCancelButton, FormSubmitButton, TranslatedText } from '..';
import { Colors, FORM_TYPES } from '../../constants';
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
      title={<TranslatedText stringId="medication.pauseModal.title" fallback="Pause medication" />}
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
            <Box
              mx={-4}
              mb={-1.5}
              px={5}
              pt={2.5}
              borderTop={`1px solid ${Colors.outline}`}
              display={'flex'}
              justifyContent={'flex-end'}
              gap={2}
            >
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
            </Box>
          </>
        )}
      />
    </StyledBaseModal>
  );
};
