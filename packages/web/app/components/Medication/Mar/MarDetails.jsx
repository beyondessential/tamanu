import React, { useState } from 'react';

import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Colors, FORM_TYPES } from '../../../constants';
import { Button, OutlinedButton } from '../../Button';
import { MarInfoPane } from './MarInfoPane';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from '../../Translation';
import { FormModal } from '../../FormModal';
import { CheckField, Field, Form, TextField } from '../../Field';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { IconButton } from '@mui/material';
import { Edit, Add } from '@material-ui/icons';
import { ADMINISTRATION_STATUS, ADMINISTRATION_STATUS_LABELS } from '@tamanu/constants';
import { formatTimeSlot, getDose } from '../../../utils/medications';
import { useTranslation } from '../../../contexts/Translation';
import { ChangeStatusModal } from './ChangeStatusModal';
import { FormGrid } from '../../FormGrid';
import { useQueryClient } from '@tanstack/react-query';
import { useEncounter } from '../../../contexts/Encounter';
import {
  useCreateDosesMutation,
  useUpdateMarMutation,
} from '../../../api/mutations/useMarMutation';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import { useSuggester } from '../../../api';
import * as yup from 'yup';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;
const Container = styled.div`
  padding: 16px 0px 34px;
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

const DarkText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
`;

const StyledEditButton = styled(IconButton)`
  position: absolute !important;
  right: 10px;
  top: 10px;
  padding: 0 !important;
  background-color: inherit !important;
`;

const StyledEditIcon = styled(Edit)`
  color: ${Colors.primary};
  font-size: 20px;
`;

const HorizontalSeparator = styled.hr`
  border: none;
  border-top: 1px solid ${Colors.outline};
  margin: 14px 0;
`;

const VerticalSeparator = styled.div`
  width: 1px;
  background-color: ${Colors.outline};
  margin: 0 20px;
`;

const StyledAddIcon = styled(Add)`
  color: ${Colors.primary};
  font-size: 18px;
`;

const AddAdditionalDoseButton = styled.a`
  color: ${Colors.primary};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  height: fit-content;
  padding-top: 14px;
  display: flex;
  align-items: center;

  &:hover {
    text-decoration: underline;
  }
`;

const StyledTimePickerField = styled(Field)`
  width: 100%;
  .MuiInputBase-root {
    font-size: 14px;
    color: ${Colors.darkestText};
    background-color: ${Colors.white};
    &.Mui-disabled {
      background-color: inherit;
    }
    &.Mui-disabled .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.outline};
    }
    .MuiSvgIcon-root {
      font-size: 22px;
    }
    .MuiInputBase-input {
      padding-top: 11.85px;
      padding-bottom: 11.85px;
      text-transform: lowercase;
    }
    .MuiOutlinedInput-notchedOutline {
      border-width: 1px !important;
    }
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.primary} !important;
    }
    :not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.softText};
    }
  }
`;

export const MarDetails = ({
  medication,
  marInfo,
  onClose,
  timeSlot,
  isFuture,
  isPast,
  selectedDate,
  isRecordedOutsideAdministrationSchedule,
  isDoseAmountNotMatch,
  isRecordedDuringPaused,
}) => {
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const requiredMessage = getTranslation('validation.required.inline', '*Required');

  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);

  const { mutateAsync: updateMar } = useUpdateMarMutation(marInfo?.id);

  const { data: { data: marDoses = [] } = {} } = useMarDoses(marInfo.id);
  const { mutateAsync: createDoses } = useCreateDosesMutation(marInfo.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      onClose();
    },
  });

  const handleOpenChangeStatusModal = () => {
    setShowChangeStatusModal(true);
  };

  const handleCloseChangeStatusModal = () => {
    setShowChangeStatusModal(false);
  };

  const handleSaveChanges = updatedAdminRecord => {
    console.log('Saving changes:', updatedAdminRecord);
    handleCloseChangeStatusModal();
  };

  const onSubmit = async (data, { setFieldValue }) => {
    await updateMar(data);
    setFieldValue('isError', false);
    queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
  };

  return (
    <>
      <StyledFormModal
        open
        title={
          <TranslatedText
            stringId="medication.mar.details.title"
            fallback="Administration record"
          />
        }
        onClose={onClose}
        isClosable
      >
        <Form
          onSubmit={onSubmit}
          formType={FORM_TYPES.EDIT_FORM}
          initialValues={{}}
          validationSchema={yup.object().shape({
            doses: yup.array().of(
              yup.object().shape({
                doseAmount: yup.number().required(requiredMessage),
                givenTime: yup.string().required(requiredMessage),
                givenByUserId: yup.string().required(requiredMessage),
                recordedByUserId: yup.string().required(requiredMessage),
              }),
            ),
          })}
          render={({ values }) => (
            <>
              <Container>
                <MarInfoPane medication={medication} marInfo={marInfo} />
                <DetailsContainer mt={'14px'} display={'flex'} flexDirection={'column'}>
                  {marInfo?.isError ? (
                    <Box display={'flex'} flexDirection={'column'}>
                      <Box display={'flex'} alignItems={'center'}>
                        <DarkText fontWeight={500}>
                          <TranslatedText
                            stringId="medication.mar.medicationMarkedAsError"
                            fallback="Medication has been marked with error"
                          />
                        </DarkText>
                        <StyledPriorityHighIcon />
                      </Box>
                      <MidText mt={'15px'}>
                        <TranslatedText stringId="medication.mar.notes" fallback="Notes" />
                      </MidText>
                      <DarkestText mt={'3px'}>{marInfo.errorNotes || '-'}</DarkestText>
                    </Box>
                  ) : (
                    <FormGrid style={{ width: '100%' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field
                          label={
                            <Box display={'flex'} alignItems={'center'}>
                              <DarkText>
                                <TranslatedText
                                  stringId="medication.mar.markAsMedicationError.label"
                                  fallback="Mark as medication error"
                                />
                              </DarkText>
                              <StyledPriorityHighIcon />
                            </Box>
                          }
                          name="isError"
                          component={CheckField}
                        />
                      </div>
                      {values.isError && (
                        <div style={{ gridColumn: '1 / -1', marginTop: '-8px' }}>
                          <Field
                            name="errorNotes"
                            label={
                              <TranslatedText stringId="medication.mar.notes" fallback="Notes" />
                            }
                            component={TextField}
                          />
                        </div>
                      )}
                    </FormGrid>
                  )}
                  {(isRecordedOutsideAdministrationSchedule ||
                    isDoseAmountNotMatch ||
                    isRecordedDuringPaused) && (
                    <>
                      <HorizontalSeparator />
                      <MidText>
                        <TranslatedText
                          stringId="medication.mar.medicationAlert"
                          fallback="Medication alert"
                        />
                      </MidText>
                      {isDoseAmountNotMatch && (
                        <DarkestText mt={'3px'}>
                          <TranslatedText
                            stringId="medication.mar.doseAmountNotMatch"
                            fallback="Dose amount does not match prescription"
                          />
                        </DarkestText>
                      )}
                      {isRecordedOutsideAdministrationSchedule && (
                        <DarkestText mt={'3px'}>
                          <TranslatedText
                            stringId="medication.mar.recordedOutsideAdministrationSchedule"
                            fallback="Dose recorded outside of administration schedule"
                          />
                        </DarkestText>
                      )}
                      {isRecordedDuringPaused && (
                        <DarkestText mt={'3px'}>
                          <TranslatedText
                            stringId="medication.mar.recordedDuringPaused"
                            fallback="Dose recorded while medication was paused"
                          />
                        </DarkestText>
                      )}
                    </>
                  )}
                </DetailsContainer>
                <DetailsContainer mt={'14px'}>
                  <MidText>
                    <TranslatedText stringId="medication.mar.status" fallback="Status" />
                  </MidText>
                  <DarkestText mt={'3px'}>
                    <TranslatedEnum
                      value={marInfo.status}
                      enumValues={ADMINISTRATION_STATUS_LABELS}
                    />
                  </DarkestText>
                  <StyledEditButton disableRipple onClick={handleOpenChangeStatusModal}>
                    <StyledEditIcon />
                  </StyledEditButton>
                </DetailsContainer>
                <HorizontalSeparator />
                <DetailsContainer display={'flex'}>
                  <Box flex={1}>
                    {marInfo.status === ADMINISTRATION_STATUS.GIVEN && (
                      <>
                        <MidText>
                          <TranslatedText
                            stringId="medication.mar.doseGiven"
                            fallback="Dose given"
                          />
                        </MidText>
                        <DarkestText mt={'3px'}>
                          {getDose(
                            { ...medication, doseAmount: marInfo.doses[0].doseAmount },
                            getTranslation,
                            getEnumTranslation,
                          )}
                        </DarkestText>
                        <MidText mt={'15px'}>
                          <TranslatedText stringId="medication.mar.givenBy" fallback="Given by" />
                        </MidText>
                        <DarkestText mt={'3px'}>
                          {marInfo.doses[0].givenByUser.displayName}
                        </DarkestText>
                      </>
                    )}
                    {marInfo.status === ADMINISTRATION_STATUS.NOT_GIVEN && (
                      <>
                        <MidText>
                          <TranslatedText stringId="medication.mar.reason" fallback="Reason" />
                        </MidText>
                        <DarkestText mt={'3px'}>
                          <TranslatedReferenceData
                            value={marInfo.reasonNotGiven.id}
                            fallback={marInfo.reasonNotGiven.name}
                            category={marInfo.reasonNotGiven.type}
                          />
                        </DarkestText>
                      </>
                    )}
                  </Box>
                  <VerticalSeparator />
                  <Box flex={1} mr={2.5}>
                    {marInfo.status === ADMINISTRATION_STATUS.GIVEN && (
                      <>
                        <MidText>
                          <TranslatedText
                            stringId="medication.mar.timeGiven"
                            fallback="Time given"
                          />
                        </MidText>
                        <DarkestText mt={'3px'}>
                          {formatTimeSlot(new Date(marInfo.doses[0].givenTime))}
                        </DarkestText>
                        <MidText mt={'15px'}>
                          <TranslatedText
                            stringId="medication.mar.recordedBy"
                            fallback="Recorded by"
                          />
                        </MidText>
                        <DarkestText mt={'3px'}>{marInfo.recordedByUser.displayName}</DarkestText>
                      </>
                    )}
                    {marInfo.status === ADMINISTRATION_STATUS.NOT_GIVEN && (
                      <>
                        <MidText>
                          <TranslatedText
                            stringId="medication.mar.recordedBy"
                            fallback="Recorded by"
                          />
                        </MidText>
                        <DarkestText mt={'3px'}>{marInfo.recordedByUser.displayName}</DarkestText>
                      </>
                    )}
                  </Box>
                  <StyledEditButton disableRipple>
                    <StyledEditIcon />
                  </StyledEditButton>
                </DetailsContainer>
                <AddAdditionalDoseButton>
                  <StyledAddIcon />
                  <TranslatedText
                    stringId="medication.mar.addAdditionalDose"
                    fallback="Add additional dose"
                  />
                </AddAdditionalDoseButton>
              </Container>

              <Box
                mx={-4}
                px={4}
                pt={2.5}
                borderTop={`1px solid ${Colors.outline}`}
                display={'flex'}
                justifyContent={'flex-end'}
              >
                {values.isError ? (
                  <Box display={'flex'} style={{ gap: '10px' }}>
                    <OutlinedButton onClick={onClose}>
                      <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                    </OutlinedButton>
                    <Button type="submit">
                      <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                    </Button>
                  </Box>
                ) : (
                  <Button onClick={onClose} type="submit">
                    <TranslatedText stringId="general.action.close" fallback="Close" />
                  </Button>
                )}
              </Box>
            </>
          )}
        />
      </StyledFormModal>
      <ChangeStatusModal
        open={showChangeStatusModal}
        onClose={handleCloseChangeStatusModal}
        onSave={handleSaveChanges}
        medication={medication}
        marInfo={marInfo}
        timeSlot={timeSlot}
        isFuture={isFuture}
        isPast={isPast}
        selectedDate={selectedDate}
      />
    </>
  );
};
