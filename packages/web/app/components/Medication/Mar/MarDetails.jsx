import React, { Fragment, useState } from 'react';

import styled from 'styled-components';
import * as yup from 'yup';
import { FieldArray } from 'formik';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { MarInfoPane } from './MarInfoPane';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from '../../Translation';
import { FormModal } from '../../FormModal';
import {
  TextField,
  Form,
  Button,
  OutlinedButton,
  FormGrid,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { AutocompleteField, CheckField, Field, NumberField } from '../../Field';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { Box, IconButton } from '@mui/material';
import { Edit, Add, Remove } from '@material-ui/icons';
import { ADMINISTRATION_STATUS, ADMINISTRATION_STATUS_LABELS, FORM_TYPES } from '@tamanu/constants';
import { TimeSlotDisplay, isWithinTimeSlot } from '../../../utils/medications';
import { useTranslation } from '../../../contexts/Translation';
import { ChangeStatusModal } from './ChangeStatusModal';
import { useQueryClient } from '@tanstack/react-query';
import { useEncounter } from '../../../contexts/Encounter';
import { useUpdateMarMutation } from '../../../api/mutations/useMarMutation';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import { useSuggester } from '../../../api';
import { TimePickerField } from '../../Field/TimePickerField';
import { useAuth } from '../../../contexts/Auth';
import { RemoveAdditionalDoseModal } from './RemoveAdditionalDoseModal';
import { EditAdministrationRecordModal } from './EditAdministrationRecordModal';
import { WarningModal } from '../WarningModal';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { ConditionalTooltip } from '../../Tooltip';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';
import { getMarDoseDisplay } from '@tamanu/shared/utils/medication';

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

const DoseIndex = styled(Box)`
  font-size: 16px;
  line-height: 21px;
  color: ${Colors.darkText};
  font-weight: 500;
`;

const RemoveDoseText = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: underline;

  .MuiSvgIcon-root {
    font-size: 12px !important;
  }
`;

const RequiredMark = styled.span`
  color: ${Colors.alert};
`;

const ErrorMessage = styled.div`
  color: ${Colors.alert};
  font-size: 12px;
  margin: 4px 2px 2px;
  font-weight: 500;
  line-height: 15px;
`;

export const MarDetails = ({
  medication,
  marInfo,
  onClose,
  timeSlot,
  isRecordedOutsideAdministrationSchedule,
  isDoseAmountNotMatch,
  isRecordedDuringPaused,
}) => {
  const { ability, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const requiredMessage = getTranslation('validation.required.inline', '*Required');

  const [showWarningModal, setShowWarningModal] = useState('');
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showEditDoseModal, setShowEditDoseModal] = useState(null);
  const [showRemoveDoseModal, setShowRemoveDoseModal] = useState(null);

  const { data: { data: marDoses = [] } = {} } = useMarDoses(marInfo.id);
  const { mutateAsync: updateMar } = useUpdateMarMutation(marInfo?.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      queryClient.invalidateQueries(['marDoses', marInfo?.id]);
    },
  });

  const canEditMar = ability.can('write', 'MedicationAdministration');

  const handleOpenChangeStatusModal = () => {
    setShowChangeStatusModal(true);
  };

  const handleCloseChangeStatusModal = () => {
    setShowChangeStatusModal(false);
  };

  const handleRemoveExistingDose = async dose => {
    setShowRemoveDoseModal(dose);
  };

  const handleOpenEditDoseModal = dose => {
    setShowEditDoseModal(dose);
  };

  const onSubmit = async (data, { setFieldValue }) => {
    const isDoseAmountNotMatch =
      !medication.isVariableDose &&
      data.doses.some(dose => Number(dose.doseAmount) !== Number(medication.doseAmount));
    if (!showWarningModal && isDoseAmountNotMatch) {
      setShowWarningModal(MAR_WARNING_MODAL.NOT_MATCHING_DOSE);
      return;
    }

    await updateMar({
      ...data,
      doses: data.doses.map(dose => ({
        ...dose,
        givenTime: toDateTimeString(dose.givenTime),
        doseAmount: Number(dose.doseAmount),
      })),
    });
    setFieldValue('isError', false);
    setFieldValue('doses', []);
    onClose();
  };

  return (
    <>
      <StyledFormModal
        open
        title={
          <TranslatedText
            stringId="medication.medication.mar.title"
            fallback="Administration record"
          />
        }
        onClose={onClose}
        isClosable
      >
        <Form
          suppressErrorDialog
          onSubmit={onSubmit}
          formType={FORM_TYPES.EDIT_FORM}
          initialValues={{
            doses: [],
          }}
          validationSchema={yup.object().shape({
            doses: yup.array().of(
              yup.object().shape({
                doseAmount: yup.number().required(requiredMessage),
                givenTime: yup
                  .date()
                  .nullable()
                  .typeError(requiredMessage)
                  .required(requiredMessage)
                  .test(
                    'time-within-slot',
                    <TranslatedText
                      stringId="medication.mar.givenTime.validation.outside"
                      fallback="Time is outside selected window"
                    />,
                    value => isWithinTimeSlot(timeSlot, value),
                  ),
                givenByUserId: yup.string().required(requiredMessage),
                recordedByUserId: yup.string().required(requiredMessage),
              }),
            ),
          })}
          render={({ values, setFieldValue, errors }) => (
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
                      <div style={{ gridColumn: '1 / -1', width: 'fit-content' }}>
                        <ConditionalTooltip
                          visible={!canEditMar}
                          title={
                            <TranslatedText
                              stringId="general.error.noPermission"
                              fallback="No permission to perform this action"
                            />
                          }
                        >
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
                            disabled={!canEditMar}
                          />
                        </ConditionalTooltip>
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
                  {canEditMar && (
                    <NoteModalActionBlocker>
                      <StyledEditButton disableRipple onClick={handleOpenChangeStatusModal}>
                        <StyledEditIcon />
                      </StyledEditButton>
                    </NoteModalActionBlocker>
                  )}
                </DetailsContainer>
                {marInfo.status == ADMINISTRATION_STATUS.NOT_GIVEN && (
                  <Fragment>
                    <HorizontalSeparator />
                    <DetailsContainer display={'flex'}>
                      <Box flex={1}>
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
                      </Box>
                      <VerticalSeparator />
                      <Box flex={1} mr={2.5}>
                        <MidText>
                          <TranslatedText
                            stringId="medication.mar.recordedBy"
                            fallback="Recorded by"
                          />
                        </MidText>
                        <DarkestText mt={'3px'}>{marInfo.recordedByUser.displayName}</DarkestText>
                      </Box>
                      {canEditMar && (
                        <NoteModalActionBlocker>
                          <StyledEditButton
                            disableRipple
                            onClick={() => handleOpenEditDoseModal({})}
                          >
                            <StyledEditIcon />
                          </StyledEditButton>
                        </NoteModalActionBlocker>
                      )}
                    </DetailsContainer>
                  </Fragment>
                )}
                {marInfo.status === ADMINISTRATION_STATUS.GIVEN &&
                  marDoses.map(dose => (
                    <Fragment key={dose.id}>
                      <HorizontalSeparator />
                      {(marDoses.length > 1 || !!values.doses.length) && (
                        <Box
                          mb={'14px'}
                          display={'flex'}
                          justifyContent={'space-between'}
                          alignItems={'center'}
                        >
                          <DoseIndex display={'flex'} alignItems={'center'} gap={0.5}>
                            <TranslatedText
                              stringId="medication.mar.dose"
                              fallback="Dose :index"
                              replacements={{ index: dose.doseIndex + 1 }}
                            />
                            {dose.isRemoved && (
                              <Box sx={{ color: Colors.midText }}>
                                <TranslatedText
                                  stringId="medication.mar.removed"
                                  fallback="(removed)"
                                />
                              </Box>
                            )}
                          </DoseIndex>
                          {dose.doseIndex !== 0 && !dose.isRemoved && canEditMar && (
                            <RemoveDoseText onClick={() => handleRemoveExistingDose(dose)}>
                              <Remove fontSize="small" />
                              <TranslatedText
                                stringId="medication.mar.action.removeAdditionalDose"
                                fallback="Remove additional dose"
                              />
                            </RemoveDoseText>
                          )}
                        </Box>
                      )}
                      {!dose.isRemoved && (
                        <DetailsContainer display={'flex'}>
                          <Box flex={1}>
                            <MidText>
                              <TranslatedText
                                stringId="medication.mar.doseGiven"
                                fallback="Dose given"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>
                              {getMarDoseDisplay(
                                { doseAmount: dose.doseAmount, units: medication.units },
                                getEnumTranslation,
                              )}
                            </DarkestText>
                            <MidText mt={'15px'}>
                              <TranslatedText
                                stringId="medication.mar.givenBy"
                                fallback="Given by"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>{dose.givenByUser.displayName}</DarkestText>
                          </Box>
                          <VerticalSeparator />
                          <Box flex={1} mr={2.5}>
                            <MidText>
                              <TranslatedText
                                stringId="medication.mar.timeGiven"
                                fallback="Time given"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>
                              <TimeSlotDisplay time={dose.givenTime} />
                            </DarkestText>
                            <MidText mt={'15px'}>
                              <TranslatedText
                                stringId="medication.mar.recordedBy"
                                fallback="Recorded by"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>{dose.recordedByUser.displayName}</DarkestText>
                          </Box>
                          {canEditMar && (
                            <NoteModalActionBlocker>
                              <StyledEditButton
                                disableRipple
                                onClick={() => handleOpenEditDoseModal(dose)}
                              >
                                <StyledEditIcon />
                              </StyledEditButton>
                            </NoteModalActionBlocker>
                          )}
                        </DetailsContainer>
                      )}
                    </Fragment>
                  ))}
                {showWarningModal && (
                  <WarningModal
                    modal={showWarningModal}
                    onClose={() => setShowWarningModal('')}
                    onConfirm={() => {
                      setShowWarningModal('');
                      onSubmit(values, { setFieldValue });
                    }}
                  />
                )}
                <FieldArray name="doses">
                  {formArrayMethods => (
                    <>
                      {values?.doses?.map((_, index) => (
                        <div key={index}>
                          <HorizontalSeparator />
                          <Box
                            mb={'14px'}
                            display={'flex'}
                            justifyContent={'space-between'}
                            alignItems={'center'}
                          >
                            <DoseIndex>
                              <TranslatedText
                                stringId="medication.mar.form.dose.label"
                                fallback="Dose :index"
                                replacements={{ index: index + marDoses.length + 1 }}
                              />
                            </DoseIndex>
                            <RemoveDoseText onClick={() => formArrayMethods.remove(index)}>
                              <Remove fontSize="small" />
                              <TranslatedText
                                stringId="medication.mar.action.removeAdditionalDose"
                                fallback="Remove additional dose"
                              />
                            </RemoveDoseText>
                          </Box>
                          <FormGrid>
                            <Field
                              name={`doses.${index}.doseAmount`}
                              component={NumberField}
                              label={`Dose given (${medication?.units})`}
                              required
                            />
                            <div>
                              <DarkText fontWeight={500} mb={'3px'}>
                                <TranslatedText
                                  stringId="medication.mar.givenTime.label"
                                  fallback="Time given"
                                />
                                <RequiredMark>*</RequiredMark>
                              </DarkText>
                              <StyledTimePickerField
                                name={`doses.${index}.givenTime`}
                                onChange={value => {
                                  setFieldValue(`doses.${index}.givenTime`, value);
                                }}
                                component={TimePickerField}
                                format="hh:mmaa"
                                timeSteps={{ minutes: 1 }}
                                error={errors[`doses.${index}.givenTime`]}
                                slotProps={{
                                  textField: {
                                    InputProps: {
                                      placeholder: '--:-- --',
                                    },
                                    error: errors?.doses?.[index]?.givenTime,
                                  },
                                  digitalClockSectionItem: {
                                    sx: { fontSize: '14px' },
                                  },
                                }}
                              />
                              {errors?.doses?.[index]?.givenTime && (
                                <ErrorMessage>{errors?.doses?.[index]?.givenTime}</ErrorMessage>
                              )}
                            </div>
                            <Field
                              name={`doses.${index}.givenByUserId`}
                              component={AutocompleteField}
                              label="Given by"
                              suggester={practitionerSuggester}
                              required
                            />
                            <Field
                              name={`doses.${index}.recordedByUserId`}
                              component={AutocompleteField}
                              label="Recorded by"
                              suggester={practitionerSuggester}
                              required
                            />
                          </FormGrid>
                        </div>
                      ))}
                      {marInfo.status === ADMINISTRATION_STATUS.GIVEN && canEditMar && (
                        <NoteModalActionBlocker>
                          <AddAdditionalDoseButton
                            onClick={() =>
                              formArrayMethods.push({
                                doseAmount: medication?.isVariableDose
                                  ? ''
                                  : medication?.doseAmount,
                                givenByUserId: currentUser?.id,
                                recordedByUserId: currentUser?.id,
                                givenTime: null,
                              })
                            }
                          >
                            <StyledAddIcon />
                            <TranslatedText
                              stringId="medication.mar.addAdditionalDose"
                              fallback="Add additional dose"
                            />
                          </AddAdditionalDoseButton>
                        </NoteModalActionBlocker>
                      )}
                    </>
                  )}
                </FieldArray>
              </Container>

              <Box
                mx={-4}
                px={4}
                pt={2.5}
                borderTop={`1px solid ${Colors.outline}`}
                display={'flex'}
                justifyContent={'flex-end'}
              >
                {values.isError || values.doses.length > 0 ? (
                  <Box display={'flex'} style={{ gap: '10px' }}>
                    <OutlinedButton onClick={onClose}>
                      <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                    </OutlinedButton>
                    <NoteModalActionBlocker>
                      <Button type="submit">
                        <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                      </Button>
                    </NoteModalActionBlocker>
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
      {!!showChangeStatusModal && (
        <ChangeStatusModal
          open={showChangeStatusModal}
          onClose={handleCloseChangeStatusModal}
          medication={medication}
          marInfo={marInfo}
          timeSlot={timeSlot}
        />
      )}
      {!!showRemoveDoseModal && (
        <RemoveAdditionalDoseModal
          open={showRemoveDoseModal}
          onClose={() => setShowRemoveDoseModal(null)}
          medication={medication}
          marInfo={marInfo}
          dose={showRemoveDoseModal}
        />
      )}
      {!!showEditDoseModal && (
        <EditAdministrationRecordModal
          open={showEditDoseModal}
          onClose={() => setShowEditDoseModal(false)}
          medication={medication}
          marInfo={marInfo}
          timeSlot={timeSlot}
          showDoseIndex={marDoses?.length > 1}
          doseInfo={showEditDoseModal}
        />
      )}
    </>
  );
};
