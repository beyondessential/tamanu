import { Divider } from '@material-ui/core';
import Box from '@mui/material/Box';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import styled from 'styled-components';

import { getMarDoseDisplay } from '@tamanu/shared/utils/medication';
import {
  ConfirmCancelRow,
  Field,
  Form,
  FormGrid,
  TextField,
  TimeDisplay,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { useDeleteDoseMutation } from '../../../api/mutations/useMarMutation';
import { FormModal } from '../../FormModal';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-inline-size: 670px;
  }
`;

const StyledDivider = styled(Divider)`
  margin: 0 -32px;
  grid-column: span 2;
`;

const DetailsContainer = styled(Box)`
  background-color: ${p => p.theme.palette.background.paper};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  padding-block: 12px;
  padding-inline: 16px;
  position: relative;
`;

const MidText = styled(Box)`
  color: ${p => p.theme.palette.text.tertiary};
  font-size: 14px;
  line-height: 1.3;
`;

const DarkestText = styled(Box)`
  color: ${p => p.theme.palette.text.primary};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
`;

const VerticalSeparator = styled.div`
  background-color: ${p => p.theme.palette.divider};
  margin: 0 20px;
  width: 1px;
`;
export const RemoveAdditionalDoseModal = ({ open, onClose, medication, dose }) => {
  const queryClient = useQueryClient();
  const { getEnumTranslation } = useTranslation();

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
    <StyledFormModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.mar.removeAdditionalDose"
          fallback="Remove additional dose"
        />
      }
    >
      <DarkestText mb="25px" pr={2} fontWeight="400 !important">
        <TranslatedText
          stringId="medication.mar.removeAdditionalDose.description"
          fallback="Are you sure you would like to remove the below additional dose record? This cannot be undone."
        />
      </DarkestText>
      <DetailsContainer display="flex">
        <Box flex={1}>
          <MidText>
            <TranslatedText stringId="medication.mar.doseGiven" fallback="Dose given" />
          </MidText>
          <DarkestText mt="3px">
            {getMarDoseDisplay(
              { doseAmount: dose.doseAmount, dosingUnit: medication.dosingUnit },
              getEnumTranslation,
            )}
          </DarkestText>
          <MidText mt="15px">
            <TranslatedText stringId="medication.mar.givenBy" fallback="Given by" />
          </MidText>
          <DarkestText mt="3px">{dose.givenByUser.displayName}</DarkestText>
        </Box>
        <VerticalSeparator />
        <Box flex={1} mr={2.5}>
          <MidText>
            <TranslatedText stringId="medication.mar.timeGiven" fallback="Time given" />
          </MidText>
          <DarkestText mt="3px">
            <TimeDisplay date={dose.givenTime} noTooltip />
          </DarkestText>
          <MidText mt="15px">
            <TranslatedText stringId="medication.mar.recordedBy" fallback="Recorded by" />
          </MidText>
          <DarkestText mt="3px">{dose.recordedByUser.displayName}</DarkestText>
        </Box>
      </DetailsContainer>
      <Box height={16} />
      <Form
        onSubmit={handleSubmit}
        initialValues={{}}
        render={({ submitForm }) => {
          return (
            <FormGrid>
              <div style={{ gridColumn: '1 / -1' }}>
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
    </StyledFormModal>
  );
};
