import React, { useState } from 'react';
import { ADMINISTRATION_STATUS, ADMINISTRATION_STATUS_LABELS } from '@tamanu/constants';
import * as yup from 'yup';
import { Box, Divider } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import {
  Field,
  Form,
  TranslatedSelectField,
  TextField,
  NumberField,
  AutocompleteField,
} from '../../Field';
import { FormGrid } from '../../FormGrid';
import { ConfirmCancelRow, FormModal, TranslatedText } from '../..';
import { useAuth } from '../../../contexts/Auth';
import { useSuggester } from '../../../api';
import { Colors } from '../../../constants';
import { TimePickerField } from '../../Field/TimePickerField';
import { useEncounter } from '../../../contexts/Encounter';
import { useGivenMarMutation, useNotGivenMarMutation } from '../../../api/mutations/useMarMutation';
import { isWithinTimeSlot } from '../../../utils/medications';
import { MarInfoPane } from './MarInfoPane';
import { WarningModal } from '../WarningModal';
import { MAR_WARNING_MODAL } from '../../../constants/medication';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const StatusAlert = styled.div`
  font-size: 11px;
  color: ${Colors.darkText};
`;

const TimeGivenTitle = styled.div`
  color: ${Colors.darkText};
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 3px;
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

const StyledDivider = styled(Divider)`
  margin: 0 -32px;
  grid-column: span 2;
`;

export const ChangeStatusModal = ({ open, onClose, medication, marInfo, timeSlot }) => {
  const { currentUser } = useAuth();
  const practitionerSuggester = useSuggester('practitioner');
  const medicationReasonNotGivenSuggester = useSuggester('medicationNotGivenReason');
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const [showWarningModal, setShowWarningModal] = useState('');

  const initialStatus = marInfo?.status;
  const initialPrescribedDose = medication?.isVariableDose ? '' : medication?.doseAmount;

  const { mutateAsync: updateMarToNotGiven } = useNotGivenMarMutation(marInfo?.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      queryClient.invalidateQueries(['marDoses', marInfo?.id]);
      onClose();
    },
  });
  const { mutateAsync: updateMarToGiven } = useGivenMarMutation(marInfo?.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      queryClient.invalidateQueries(['marDoses', marInfo?.id]);
      onClose();
    },
  });

  const handleSubmit = async values => {
    if (values.status === ADMINISTRATION_STATUS.NOT_GIVEN) {
      const { reasonNotGivenId, recordedByUserId, changingStatusReason } = values;
      await updateMarToNotGiven({
        reasonNotGivenId,
        recordedByUserId,
        changingStatusReason,
      });
    } else {
      const {
        doseAmount,
        givenTime,
        givenByUserId,
        recordedByUserId,
        changingStatusReason,
      } = values;
      if (
        !showWarningModal &&
        Number(doseAmount) !== Number(medication?.doseAmount) &&
        !medication?.isVariableDose
      ) {
        setShowWarningModal(MAR_WARNING_MODAL.NOT_MATCHING_DOSE);
        return;
      }
      await updateMarToGiven({
        dose: {
          doseAmount: Number(doseAmount),
          givenTime,
          givenByUserId,
          recordedByUserId,
        },
        recordedByUserId,
        changingStatusReason,
      });
    }
    onClose();
  };

  const getValidationSchema = () => {
    if (initialStatus === ADMINISTRATION_STATUS.NOT_GIVEN) {
      return yup.object().shape({
        givenTime: yup
          .date()
          .nullable()
          .typeError(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
          .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
          .test(
            'time-within-slot',
            <TranslatedText
              stringId="medication.mar.givenTime.validation.outside"
              fallback="Time is outside selected window"
            />,
            value => isWithinTimeSlot(timeSlot, value),
          ),
        givenByUserId: yup
          .string()
          .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
        recordedByUserId: yup
          .string()
          .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
      });
    }
    return yup.object().shape({
      reasonNotGivenId: yup
        .string()
        .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
      recordedByUserId: yup
        .string()
        .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
    });
  };

  const getInitialValues = () => {
    if (initialStatus === ADMINISTRATION_STATUS.GIVEN) {
      return {
        status: initialStatus,
        reasonNotGivenId: '',
        recordedByUserId: currentUser?.id,
      };
    }
    return {
      status: initialStatus,
      recordedByUserId: currentUser?.id,
      givenByUserId: currentUser?.id,
      doseAmount: initialPrescribedDose,
      givenTime: null,
    };
  };

  return (
    <StyledFormModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="modal.mar.changeStatusModal.title"
          fallback="Change Administration Status"
        />
      }
    >
      <MarInfoPane medication={medication} marInfo={marInfo} />
      <Box height={16} />
      <Form
        suppressErrorDialog
        onSubmit={handleSubmit}
        initialValues={getInitialValues()}
        validationSchema={getValidationSchema()}
        render={({ values, setFieldValue, errors, submitForm }) => {
          const isChangingToNotGiven =
            initialStatus !== ADMINISTRATION_STATUS.NOT_GIVEN &&
            values.status === ADMINISTRATION_STATUS.NOT_GIVEN;
          const isChangingToGiven =
            initialStatus !== ADMINISTRATION_STATUS.GIVEN &&
            values.status === ADMINISTRATION_STATUS.GIVEN;
          return (
            <FormGrid>
              <div>
                <Field
                  name="status"
                  component={TranslatedSelectField}
                  label="Status"
                  enumValues={ADMINISTRATION_STATUS_LABELS}
                  required
                />
                {isChangingToNotGiven && (
                  <StatusAlert>
                    <TranslatedText
                      stringId="medication.changeStatusModal.statusAlert"
                      fallback="Changing the status to not given will remove all previously recorded doses"
                    />
                  </StatusAlert>
                )}
              </div>
              {isChangingToNotGiven && (
                <>
                  <Field
                    name="reasonNotGivenId"
                    component={AutocompleteField}
                    label="Reason"
                    suggester={medicationReasonNotGivenSuggester}
                    required
                  />
                  <Field
                    name="recordedByUserId"
                    component={AutocompleteField}
                    label="Recorded by"
                    suggester={practitionerSuggester}
                    required
                  />
                  <Field
                    name="changingStatusReason"
                    component={TextField}
                    label="Reason for change (Optional)"
                  />
                </>
              )}

              {isChangingToGiven && (
                <>
                  <Field
                    name="doseAmount"
                    component={NumberField}
                    label={`Dose given (${medication?.units})`}
                  />
                  <div>
                    <TimeGivenTitle>
                      <TranslatedText
                        stringId="medication.mar.givenTime.label"
                        fallback="Time given"
                      />
                      <RequiredMark>*</RequiredMark>
                    </TimeGivenTitle>
                    <StyledTimePickerField
                      name="givenTime"
                      onChange={value => {
                        setFieldValue('givenTime', value);
                      }}
                      component={TimePickerField}
                      format="hh:mmaa"
                      timeSteps={{ minutes: 1 }}
                      error={errors.givenTime}
                      slotProps={{
                        textField: {
                          InputProps: {
                            placeholder: '--:-- --',
                          },
                          error: errors.givenTime,
                        },
                        digitalClockSectionItem: {
                          sx: { fontSize: '14px' },
                        },
                      }}
                    />
                    {errors.givenTime && <ErrorMessage>{errors.givenTime}</ErrorMessage>}
                  </div>
                  <Field
                    name="givenByUserId"
                    component={AutocompleteField}
                    label="Given by"
                    suggester={practitionerSuggester}
                    required
                  />
                  <Field
                    name="recordedByUserId"
                    component={AutocompleteField}
                    label="Recorded by"
                    suggester={practitionerSuggester}
                    required
                  />
                  <Field
                    name="changingStatusReason"
                    component={TextField}
                    label="Reason for change (Optional)"
                  />
                </>
              )}
              <StyledDivider />
              <ConfirmCancelRow
                onCancel={onClose}
                onConfirm={submitForm}
                confirmDisabled={!(isChangingToGiven || isChangingToNotGiven)}
                confirmText={
                  <TranslatedText stringId="general.action.saveChanges" fallback="Save Changes" />
                }
                cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
              />
              {showWarningModal && (
                <WarningModal
                  modal={showWarningModal}
                  onClose={() => setShowWarningModal('')}
                  onConfirm={() => {
                    setShowWarningModal('');
                    handleSubmit(values);
                  }}
                />
              )}
            </FormGrid>
          );
        }}
      />
    </StyledFormModal>
  );
};
