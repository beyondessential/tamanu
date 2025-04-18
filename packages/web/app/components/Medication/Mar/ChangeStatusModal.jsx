import React from 'react';
import { ADMINISTRATION_STATUS, ADMINISTRATION_STATUS_LABELS } from '@tamanu/constants';
import * as yup from 'yup';
import { Modal } from '../../Modal';
import {
  Field,
  Form,
  TranslatedSelectField,
  TextField,
  NumberField,
  AutocompleteField,
} from '../../Field';
import { FormGrid } from '../../FormGrid';
import { ConfirmCancelRow, TranslatedText } from '../..';
import { useAuth } from '../../../contexts/Auth';
import { useSuggester } from '../../../api';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { TimePickerField } from '../../Field/TimePickerField';
import { Box, Divider } from '@material-ui/core';
import { useGivenMarMutation, useNotGivenMarMutation } from '../../../api/mutations/useMarMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useEncounter } from '../../../contexts/Encounter';
import { isWithinTimeSlot } from '../../../utils/validation';
import { MarInfoPane } from './MarInfoPane';

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
  const reasonNotGivenSuggester = useSuggester('reasonNotGiven');
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();

  const initialStatus = marInfo?.status;
  const initialPrescribedDose = medication?.isVariableDose ? '' : medication?.doseAmount;

  const { mutateAsync: updateMarToNotGiven } = useNotGivenMarMutation(marInfo?.id);
  const { mutateAsync: updateMarToGiven } = useGivenMarMutation(marInfo?.id);

  const handleSubmit = async values => {
    if (values.status === ADMINISTRATION_STATUS.NOT_GIVEN) {
      await updateMarToNotGiven(values);
    } else {
      const { doseAmount, givenTime, givenByUserId, ...rest } = values;
      await updateMarToGiven({
        dose: {
          doseAmount: Number(doseAmount),
          givenTime,
          givenByUserId,
        },
        ...rest,
      });
    }
    queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
    onClose();
  };

  const getValidationSchema = () => {
    if (initialStatus === ADMINISTRATION_STATUS.NOT_GIVEN) {
      return yup.object().shape({
        givenTime: yup
          .date()
          .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
          .test(
            'time-within-slot',
            <TranslatedText
              stringId="medication.mar.givenTime.validation.outside"
              fallback="Time is outside selected window"
            />,
            value => isWithinTimeSlot(timeSlot, value),
          ),
        givenBy: yup
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

  return (
    <Modal open={open} onClose={onClose} title="Change Administration Status">
      <MarInfoPane medication={medication} marInfo={marInfo} />
      <Box height={16} />
      <Form
        onSubmit={handleSubmit}
        initialValues={{
          status: initialStatus,
          recordedByUserId: currentUser?.id,
          givenByUserId: currentUser?.id,
          doseAmount: initialPrescribedDose,
        }}
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
                    suggester={reasonNotGivenSuggester}
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
                    name="reasonForChange"
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
                    name="reasonForChange"
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
            </FormGrid>
          );
        }}
      />
    </Modal>
  );
};
