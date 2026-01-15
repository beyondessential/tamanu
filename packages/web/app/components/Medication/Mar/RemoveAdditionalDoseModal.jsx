import React from 'react';
import { Box, Divider } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import {
  TextField,
  Form,
  FormGrid,
  ConfirmCancelRow,
  TranslatedText,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { Field } from '../../Field';
import { FormModal } from '../..';
import { useDeleteDoseMutation } from '../../../api/mutations/useMarMutation';
import { TimeSlotDisplay } from '../../../utils/medications';
import { useTranslation } from '../../../contexts/Translation';
import { getMarDoseDisplay } from '@tamanu/shared/utils/medication';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const StyledDivider = styled(Divider)`
  margin: 0 -32px;
  grid-column: span 2;
`;

const DetailsContainer = styled(Box)`
  padding: 12px 16px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  position: relative;
`;

const MidText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

const VerticalSeparator = styled.div`
  width: 1px;
  background-color: ${Colors.outline};
  margin: 0 20px;
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
      <DarkestText mb={'25px'} pr={2} fontWeight={'400 !important'}>
        <TranslatedText
          stringId="medication.mar.removeAdditionalDose.description"
          fallback="Are you sure you would like to remove the below additional dose record? This cannot be undone."
        />
      </DarkestText>
      <DetailsContainer display={'flex'}>
        <Box flex={1}>
          <MidText>
            <TranslatedText stringId="medication.mar.doseGiven" fallback="Dose given" />
          </MidText>
          <DarkestText mt={'3px'}>
            {getMarDoseDisplay(
              { doseAmount: dose.doseAmount, units: medication.units },
              getEnumTranslation,
            )}
          </DarkestText>
          <MidText mt={'15px'}>
            <TranslatedText stringId="medication.mar.givenBy" fallback="Given by" />
          </MidText>
          <DarkestText mt={'3px'}>{dose.givenByUser.displayName}</DarkestText>
        </Box>
        <VerticalSeparator />
        <Box flex={1} mr={2.5}>
          <MidText>
            <TranslatedText stringId="medication.mar.timeGiven" fallback="Time given" />
          </MidText>
          <DarkestText mt={'3px'}><TimeSlotDisplay time={dose.givenTime} /></DarkestText>
          <MidText mt={'15px'}>
            <TranslatedText stringId="medication.mar.recordedBy" fallback="Recorded by" />
          </MidText>
          <DarkestText mt={'3px'}>{dose.recordedByUser.displayName}</DarkestText>
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
