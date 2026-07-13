import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import Remove from '@mui/icons-material/Remove';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useQueryClient } from '@tanstack/react-query';
import { FieldArray } from 'formik';
import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { ADMINISTRATION_STATUS, ADMINISTRATION_STATUS_LABELS, FORM_TYPES } from '@tamanu/constants';
import { getDrugUnitLabel, getMarDoseDisplay } from '@tamanu/shared/utils/medication';
import {
  AutocompleteField,
  Button,
  ConditionalTooltip,
  Field,
  Form,
  FormGrid,
  NumberField,
  OutlinedButton,
  RequiredOrnament,
  TextField,
  TimeDisplay,
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
  useSuggester,
  useTranslation,
} from '@tamanu/ui-components';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { useUpdateMarMutation } from '../../../api/mutations/useMarMutation';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { Colors } from '../../../constants/styles';
import { useAuth } from '../../../contexts/Auth';
import { useEncounter } from '../../../contexts/Encounter';
import { isWithinTimeSlot } from '../../../utils/medications';
import { CheckField } from '../../Field';
import { TimePickerField } from '../../Field/TimePickerField';
import { FormModal } from '../../FormModal';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';
import { WarningModal } from '../WarningModal';
import { ChangeStatusModal } from './ChangeStatusModal';
import { EditAdministrationRecordModal } from './EditAdministrationRecordModal';
import { MarInfoPane } from './MarInfoPane';
import { RemoveAdditionalDoseModal } from './RemoveAdditionalDoseModal';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-inline-size: 670px;
  }
`;
const Container = styled.div`
  padding-block: 16px;
  padding-inline: 0;
`;

const DetailsContainer = styled(Box)`
  background-color: ${p => p.theme.palette.background.paper};
  border-radius: 3px;
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

const DarkText = styled(Box)`
  color: ${Colors.darkText};
  font-size: 14px;
  line-height: 1.3;
`;

const DarkestText = styled(Box)`
  color: ${p => p.theme.palette.text.primary};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
`;

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${p => p.theme.palette.error.main};
  font-size: 16px;
`;

const StyledEditIcon = styled(Edit)`
  color: ${p => p.theme.palette.primary.main};
  font-size: 20px;
`;

const EditButton = styled(IconButton).attrs({
  children: <StyledEditIcon />,
  disableRipple: true,
})`
  position: absolute !important;
  right: 10px;
  top: 10px;
  padding: 0 !important;
  background-color: inherit !important;
`;

const HorizontalSeparator = styled.hr`
  margin-block: 14px;
`;

const VerticalSeparator = styled.div`
  background-color: ${p => p.theme.palette.divider};
  margin-block: 0;
  margin-inline: 20px;
  width: 1px;
`;

const StyledAddIcon = styled(Add)`
  color: ${p => p.theme.palette.primary.main};
  font-size: 18px;
`;

const AddAdditionalDoseButton = styled.a`
  align-items: center;
  color: ${p => p.theme.palette.primary.main};
  cursor: pointer;
  display: flex;
  font-size: 14px;
  font-weight: 500;
  height: fit-content;
  padding-block-start: 14px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const StyledTimePickerField = styled(Field)`
  width: 100%;
  .MuiInputBase-root {
    background-color: ${p => p.theme.palette.background.paper};
    color: ${p => p.theme.palette.text.primary};
    font-size: 14px;
    &.Mui-disabled {
      background-color: inherit;
    }
    &.Mui-disabled .MuiOutlinedInput-notchedOutline {
      border-color: ${p => p.theme.palette.divider};
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
      border-color: ${p => p.theme.palette.primary.main} !important;
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
  align-items: center;
  color: ${p => p.theme.palette.text.primary};
  cursor: pointer;
  display: flex;
  font-size: 14px;
  font-weight: 400;
  gap: 4px;
  line-height: 1.3;
  text-decoration: underline;

  .MuiSvgIcon-root {
    font-size: 12px !important;
  }
`;

function PractitionerField(props) {
  const practitionerSuggester = useSuggester('practitioner');
  return (
    <Field component={AutocompleteField} suggester={practitionerSuggester} required {...props} />
  );
}

const ErrorMessage = styled.div`
  color: ${p => p.theme.palette.error.main};
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  margin: 4px 2px 2px;
`;

const requiredMessage = (
  <TranslatedText stringId="validation.required.inline" fallback="*Required" />
);

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
  const { getEnumTranslation } = useTranslation();
  const { toStoredDateTime } = useDateTime();
  const practitionerSuggester = useSuggester('practitioner');

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
        givenTime: toStoredDateTime(toDateTimeString(dose.givenTime)),
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
                <DetailsContainer mt="14px" display="flex" flexDirection="column">
                  {marInfo?.isError ? (
                    <Box display="flex" flexDirection="column">
                      <Box display="flex" alignItems="center">
                        <DarkText fontWeight={500}>
                          <TranslatedText
                            stringId="medication.mar.medicationMarkedAsError"
                            fallback="Medication has been marked with error"
                          />
                        </DarkText>
                        <StyledPriorityHighIcon />
                      </Box>
                      <MidText mt="15px">
                        <TranslatedText stringId="medication.mar.notes" fallback="Notes" />
                      </MidText>
                      <DarkestText mt="3px">{marInfo.errorNotes || '—' /* em dash */}</DarkestText>
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
                              <Box display="flex" alignItems="center">
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
                        <DarkestText mt="3px">
                          <TranslatedText
                            stringId="medication.mar.doseAmountNotMatch"
                            fallback="Dose amount does not match prescription"
                          />
                        </DarkestText>
                      )}
                      {isRecordedOutsideAdministrationSchedule && (
                        <DarkestText mt="3px">
                          <TranslatedText
                            stringId="medication.mar.recordedOutsideAdministrationSchedule"
                            fallback="Dose recorded outside of administration schedule"
                          />
                        </DarkestText>
                      )}
                      {isRecordedDuringPaused && (
                        <DarkestText mt="3px">
                          <TranslatedText
                            stringId="medication.mar.recordedDuringPaused"
                            fallback="Dose recorded while medication was paused"
                          />
                        </DarkestText>
                      )}
                    </>
                  )}
                </DetailsContainer>
                <DetailsContainer mt="14px">
                  <MidText>
                    <TranslatedText stringId="medication.mar.status" fallback="Status" />
                  </MidText>
                  <DarkestText mt="3px">
                    <TranslatedEnum
                      value={marInfo.status}
                      enumValues={ADMINISTRATION_STATUS_LABELS}
                    />
                  </DarkestText>
                  {canEditMar && (
                    <NoteModalActionBlocker>
                      <EditButton onClick={() => void setShowChangeStatusModal(true)} />
                    </NoteModalActionBlocker>
                  )}
                </DetailsContainer>
                {marInfo.status == ADMINISTRATION_STATUS.NOT_GIVEN && (
                  <>
                    <HorizontalSeparator />
                    <DetailsContainer display="flex">
                      <Box flex={1}>
                        <MidText>
                          <TranslatedText stringId="medication.mar.reason" fallback="Reason" />
                        </MidText>
                        <DarkestText mt="3px">
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
                        <DarkestText mt="3px">{marInfo.recordedByUser.displayName}</DarkestText>
                      </Box>
                      {canEditMar && (
                        <NoteModalActionBlocker>
                          <EditButton onClick={() => void setShowEditDoseModal({})} />
                        </NoteModalActionBlocker>
                      )}
                    </DetailsContainer>
                  </>
                )}
                {marInfo.status === ADMINISTRATION_STATUS.GIVEN &&
                  marDoses.map(dose => (
                    <Fragment key={dose.id}>
                      <HorizontalSeparator />
                      {(marDoses.length > 1 || !!values.doses.length) && (
                        <Box
                          mb="14px"
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <DoseIndex display="flex" alignItems="center" gap={0.5}>
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
                            <RemoveDoseText onClick={() => void setShowRemoveDoseModal(dose)}>
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
                        <DetailsContainer display="flex">
                          <Box flex={1}>
                            <MidText>
                              <TranslatedText
                                stringId="medication.mar.doseGiven"
                                fallback="Dose given"
                              />
                            </MidText>
                            <DarkestText mt="3px">
                              {getMarDoseDisplay(
                                { doseAmount: dose.doseAmount, dosingUnit: medication.dosingUnit },
                                getEnumTranslation,
                              )}
                            </DarkestText>
                            <MidText mt="15px">
                              <TranslatedText
                                stringId="medication.mar.givenBy"
                                fallback="Given by"
                              />
                            </MidText>
                            <DarkestText mt="3px">{dose.givenByUser.displayName}</DarkestText>
                          </Box>
                          <VerticalSeparator />
                          <Box flex={1} mr={2.5}>
                            <MidText>
                              <TranslatedText
                                stringId="medication.mar.timeGiven"
                                fallback="Time given"
                              />
                            </MidText>
                            <DarkestText mt="3px">
                              <TimeDisplay date={dose.givenTime} noTooltip />
                            </DarkestText>
                            <MidText mt="15px">
                              <TranslatedText
                                stringId="medication.mar.recordedBy"
                                fallback="Recorded by"
                              />
                            </MidText>
                            <DarkestText mt="3px">{dose.recordedByUser.displayName}</DarkestText>
                          </Box>
                          {canEditMar && (
                            <NoteModalActionBlocker>
                              <EditButton onClick={() => void setShowEditDoseModal(dose)} />
                            </NoteModalActionBlocker>
                          )}
                        </DetailsContainer>
                      )}
                    </Fragment>
                  ))}
                {showWarningModal && (
                  <WarningModal
                    modal={showWarningModal}
                    onClose={() => void setShowWarningModal('')}
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
                            mb="14px"
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
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
                              label={
                                <TranslatedText
                                  stringId="mar.details.doseGiven.label"
                                  fallback="Dose given"
                                />
                              }
                              unit={
                                medication?.dosingUnit
                                  ? getDrugUnitLabel(
                                      medication.dosingUnit,
                                      values.doses[index]?.doseAmount,
                                      getEnumTranslation,
                                    )
                                  : undefined
                              }
                              required
                            />
                            <div>
                              <DarkText fontWeight={500} mb="3px">
                                <TranslatedText
                                  stringId="medication.mar.givenTime.label"
                                  fallback="Time given"
                                />
                                <RequiredOrnament />
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
                                    InputProps: { placeholder: '‒‒:‒‒ ‒‒' /* figure dashes */ },
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
                            <PractitionerField
                              name={`doses.${index}.givenByUserId`}
                              label="Given by"
                            />
                            <PractitionerField
                              name={`doses.${index}.recordedByUserId`}
                              label="Recorded by"
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
                            <StyledAddIcon aria-hidden />
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
                display="flex"
                justifyContent="flex-end"
              >
                {values.isError || values.doses.length > 0 ? (
                  <Box display="flex" style={{ gap: '10px' }}>
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
      {showChangeStatusModal && (
        <ChangeStatusModal
          open={showChangeStatusModal}
          onClose={() => void setShowChangeStatusModal(false)}
          medication={medication}
          marInfo={marInfo}
          timeSlot={timeSlot}
        />
      )}
      {!!showRemoveDoseModal && (
        <RemoveAdditionalDoseModal
          open={showRemoveDoseModal}
          onClose={() => void setShowRemoveDoseModal(null)}
          medication={medication}
          marInfo={marInfo}
          dose={showRemoveDoseModal}
        />
      )}
      {!!showEditDoseModal && (
        <EditAdministrationRecordModal
          open={showEditDoseModal}
          onClose={() => void setShowEditDoseModal(false)}
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
