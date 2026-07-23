import { Divider } from '@material-ui/core';
import Box from '@mui/material/Box';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import styled from 'styled-components';

import {
  ConfirmCancelRow,
  Field,
  Form,
  FormGrid,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import { useDeleteDoseMutation } from '../../../api/mutations/useMarMutation';
import { FormModal } from '../../FormModal';
import DoseSummary from './DoseSummary';

const StyledDivider = styled(Divider)`
  margin: 0 -32px;
  grid-column: span 2;
`;

const DarkestText = styled(Box)`
  color: ${p => p.theme.palette.text.primary};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
`;

export const RemoveAdditionalDoseModal = ({ open, onClose, medication, dose }) => {
  const queryClient = useQueryClient();

  const { mutateAsync: deleteDose } = useDeleteDoseMutation(dose.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['marDoses', dose.marId]);
      onClose();
    },
  });

  const handleSubmit = async values => {
    await deleteDose(values);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.mar.removeAdditionalDose"
          fallback="Remove additional dose"
        />
      }
      width="sm"
    >
      <DarkestText mb="25px" pr={2} fontWeight="400 !important">
        <TranslatedText
          stringId="medication.mar.removeAdditionalDose.description"
          fallback="Are you sure you would like to remove the below additional dose record? This cannot be undone."
        />
      </DarkestText>
      <DoseSummary dose={dose} medication={medication} style={{ fontSize: 14 }} />
      <Form
        onSubmit={handleSubmit}
        initialValues={{}}
        render={({ submitForm }) => {
          return (
            <FormGrid>
              <div style={{ gridColumn: '1 / -1', marginBlockStart: '1em' }}>
                <Field
                  name="reasonForRemoval"
                  label={
                    <TranslatedText
                      stringId="medication.mar.removeAdditionalDose.reason"
                      fallback="Reason for removal"
                    />
                  }
                  component={TextField}
                />
              </div>

              <StyledDivider />
              <ConfirmCancelRow
                onCancel={onClose}
                onConfirm={submitForm}
                confirmText={
                  <TranslatedText
                    stringId="medication.mar.removeAdditionalDose.confirm"
                    fallback="Remove additional dose"
                  />
                }
              />
            </FormGrid>
          );
        }}
      />
    </FormModal>
  );
};
