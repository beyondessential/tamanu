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
import { getDrugUnitLabel } from '@tamanu/shared/utils/medication';
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
  TextButton,
  TextField,
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
import KeyValueDisplay from './KeyValueDisplay';
import DoseEntry, { DoseHeading } from './MarDose';
import { MarInfoPane } from './MarInfoPane';
import { RemoveAdditionalDoseModal } from './RemoveAdditionalDoseModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 1em;
  line-height: 1.3;
  padding-block: 16px;
  padding-inline: 0;
`;

const Card = styled(Box)`
  background-color: ${p => p.theme.palette.background.paper};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  column-rule: 1px solid ${p => p.theme.palette.divider};

  padding-block: 16px;
  padding-inline: 20px;
  position: relative;
`;

const DarkText = styled(Box)`
  color: ${p => p.theme.palette.text.secondary};
`;

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${p => p.theme.palette.error.main};
  font-size: 16px;
`;

const StyledEditIcon = styled(Edit)`
  color: ${p => p.theme.palette.primary.main};
  font-size: 20px;
`;

const EditButton = styled(({ children, onClick, ...props }) => (
  <NoteModalActionBlocker>
    <IconButton disableRipple onClick={onClick} {...props}>
      <StyledEditIcon />
      {children}
    </IconButton>
  </NoteModalActionBlocker>
))`
  position: absolute !important;
  right: 10px;
  top: 10px;
  padding: 0 !important;
  background-color: inherit !important;
`;

const HorizontalSeparator = styled.hr`
  margin-block: 14px;
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
  font-weight: 500;
  height: fit-content;
  padding-block-start: 14px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const StyledTimePickerField = styled(Field).attrs({
  component: TimePickerField,
  format: 'hh:mmaa',
  timeSteps: { minutes: 1 },
})`
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

const Dose = styled.div`
  padding-block-start: 14px;
  border-block-start: 1px solid ${p => p.theme.palette.divider};
`;

export const RemoveDoseButton = styled(TextButton).attrs({
  children: (
    <TranslatedText
      stringId="medication.mar.action.removeAdditionalDose"
      fallback="Remove additional dose"
    />
  ),
  startIcon: <Remove style={{ fontSize: 12 }} />,
})`
  color: ${p => p.theme.palette.text.primary};
  font-size: 14px;
  font-weight: 400;
  line-height: 1.3;
  text-decoration: underline;
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
      <FormModal
        open
        title={
          <TranslatedText
            stringId="medication.medication.mar.title"
            fallback="Administration record"
          />
        }
        onClose={onClose}
        isClosable
        width="sm"
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
                <Card display="flex" flexDirection="column">
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
                      <KeyValueDisplay
                        label={<TranslatedText stringId="medication.mar.notes" fallback="Notes" />}
                        value={marInfo.errorNotes || '—' /* em dash */}
                      />
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
                      <KeyValueDisplay
                        label={
                          <TranslatedText
                            stringId="medication.mar.medicationAlert"
                            fallback="Medication alert"
                          />
                        }
                        value={
                          <>
                            {isDoseAmountNotMatch && (
                              <TranslatedText
                                stringId="medication.mar.doseAmountNotMatch"
                                fallback="Dose amount does not match prescription"
                              />
                            )}
                            {isRecordedOutsideAdministrationSchedule && (
                              <TranslatedText
                                stringId="medication.mar.recordedOutsideAdministrationSchedule"
                                fallback="Dose recorded outside of administration schedule"
                              />
                            )}
                            {isRecordedDuringPaused && (
                              <TranslatedText
                                stringId="medication.mar.recordedDuringPaused"
                                fallback="Dose recorded while medication was paused"
                              />
                            )}
                          </>
                        }
                      />
                    </>
                  )}
                </Card>
                <Card>
                  <KeyValueDisplay
                    label={<TranslatedText stringId="medication.mar.status" fallback="Status" />}
                    value={
                      <TranslatedEnum
                        value={marInfo.status}
                        enumValues={ADMINISTRATION_STATUS_LABELS}
                      />
                    }
                    style={{ gridColumn: '1 / -1' }}
                  />
                  {canEditMar && <EditButton onClick={() => void setShowChangeStatusModal(true)} />}
                </Card>
                {marInfo.status == ADMINISTRATION_STATUS.NOT_GIVEN && (
                  <>
                    <HorizontalSeparator />
                    <Card display="flex">
                      <Box flex={1}>
                        <KeyValueDisplay
                          label={
                            <TranslatedText stringId="medication.mar.reason" fallback="Reason" />
                          }
                          value={
                            <TranslatedReferenceData
                              value={marInfo.reasonNotGiven.id}
                              fallback={marInfo.reasonNotGiven.name}
                              category={marInfo.reasonNotGiven.type}
                            />
                          }
                        />
                      </Box>
                      <Box flex={1} mr={2.5}>
                        <KeyValueDisplay
                          label={
                            <TranslatedText
                              stringId="medication.mar.recordedBy"
                              fallback="Recorded by"
                            />
                          }
                          value={marInfo.recordedByUser.displayName}
                        />
                      </Box>
                      {canEditMar && <EditButton onClick={() => void setShowEditDoseModal({})} />}
                    </Card>
                  </>
                )}
                {marInfo.status === ADMINISTRATION_STATUS.GIVEN &&
                  marDoses.map(dose => (
                    <Fragment key={dose.id}>
                      {(marDoses.length > 1 || !!values.doses.length) && (
                        <>
                          <DoseEntry
                            dose={dose}
                            index={dose.doseIndex + 1}
                            medication={medication}
                            onRemove={() => void setShowRemoveDoseModal(dose)}
                          >
                            {canEditMar && (
                              <EditButton onClick={() => void setShowEditDoseModal(dose)} />
                            )}
                          </DoseEntry>
                        </>
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
                          <Dose>
                            <DoseHeading>
                              <TranslatedText
                                stringId="medication.mar.form.dose.label"
                                fallback="Dose :index"
                                replacements={{ index: index + marDoses.length + 1 }}
                              />
                            </DoseHeading>
                            <RemoveDoseButton onClick={() => formArrayMethods.remove(index)} />
                          </Dose>
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
      </FormModal>
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
