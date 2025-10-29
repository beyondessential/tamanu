import React, { useState } from 'react';
import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { Box, Divider } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import {
  TextField,
  Form,
  FormGrid,
  ConfirmCancelRow,
  TranslatedText,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { Field, NumberField, AutocompleteField } from '../../Field';
import { FormModal } from '../..';
import { useSuggester } from '../../../api';
import { TimePickerField } from '../../Field/TimePickerField';
import { useEncounter } from '../../../contexts/Encounter';
import {
  useNotGivenInfoMarMutation,
  useUpdateDoseMutation,
} from '../../../api/mutations/useMarMutation';
import { isWithinTimeSlot } from '../../../utils/medications';
import { MarInfoPane } from './MarInfoPane';
import { WarningModal } from '../WarningModal';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { toast } from 'react-toastify';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
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

const DoseLabel = styled.div`
  color: ${Colors.darkText};
  font-size: 16px;
  font-weight: 500;
  margin-top: 20px;
  margin-bottom: 16px;
`;

export const EditAdministrationRecordModal = ({
  open,
  onClose,
  medication,
  marInfo,
  doseInfo,
  timeSlot,
  showDoseIndex,
}) => {
  const recordedBySuggester = useSuggester('practitioner');
  const givenBySuggester = useSuggester('practitioner');
  const medicationReasonNotGivenSuggester = useSuggester('medicationNotGivenReason');
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const [showWarningModal, setShowWarningModal] = useState('');

  const { mutateAsync: updateNotGivenInfoMar } = useNotGivenInfoMarMutation(marInfo?.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
    },
  });
  const { mutateAsync: updateMarDose } = useUpdateDoseMutation(doseInfo?.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      queryClient.invalidateQueries(['marDoses', marInfo?.id]);
    },
  });

  const handleSubmit = async values => {
    try {
      if (marInfo?.status === ADMINISTRATION_STATUS.NOT_GIVEN) {
        const { reasonNotGivenId, recordedByUserId, changingNotGivenInfoReason } = values;
        await updateNotGivenInfoMar({
          reasonNotGivenId,
          recordedByUserId,
          changingNotGivenInfoReason,
        });
      } else {
        const { doseAmount, givenTime, givenByUserId, recordedByUserId, reasonForChange } = values;
        if (
          !showWarningModal &&
          Number(medication?.doseAmount) !== Number(doseAmount) &&
          !medication?.isVariableDose
        ) {
          setShowWarningModal(MAR_WARNING_MODAL.NOT_MATCHING_DOSE);
          return;
        }
        await updateMarDose({
          doseAmount: Number(doseAmount),
          givenTime: toDateTimeString(givenTime),
          givenByUserId,
          recordedByUserId,
          reasonForChange,
        });
      }
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getValidationSchema = () => {
    if (marInfo?.status === ADMINISTRATION_STATUS.GIVEN) {
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
        doseAmount: yup
          .number()
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
    <StyledFormModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="modal.mar.editAdministrationRecordModal.title"
          fallback="Edit administration record"
        />
      }
    >
      <MarInfoPane medication={medication} marInfo={marInfo} />
      {showDoseIndex ? (
        <DoseLabel>
          <TranslatedText
            stringId="modal.mar.doseIndex.label"
            fallback="Dose :index"
            replacements={{ index: doseInfo?.doseIndex + 1 }}
          />
        </DoseLabel>
      ) : (
        <Box height={16} />
      )}
      <Form
        suppressErrorDialog
        onSubmit={handleSubmit}
        initialValues={
          marInfo?.status === ADMINISTRATION_STATUS.NOT_GIVEN
            ? {
                reasonNotGivenId: marInfo?.reasonNotGivenId,
                recordedByUserId: marInfo?.recordedByUserId,
              }
            : {
                doseAmount: doseInfo?.doseAmount,
                givenTime: doseInfo?.givenTime ? new Date(doseInfo.givenTime) : null,
                givenByUserId: doseInfo?.givenByUserId,
                recordedByUserId: doseInfo?.recordedByUserId,
              }
        }
        validationSchema={getValidationSchema()}
        render={({ setFieldValue, errors, submitForm, dirty, values }) => {
          return (
            <FormGrid>
              {marInfo?.status === ADMINISTRATION_STATUS.NOT_GIVEN && (
                <>
                  <Field
                    name="reasonNotGivenId"
                    component={AutocompleteField}
                    label={<TranslatedText stringId="mar.details.reason.label" fallback="Reason" />}
                    suggester={medicationReasonNotGivenSuggester}
                    required
                  />
                  <Field
                    name="recordedByUserId"
                    component={AutocompleteField}
                    label={
                      <TranslatedText
                        stringId="mar.details.recordedBy.label"
                        fallback="Recorded by"
                      />
                    }
                    suggester={recordedBySuggester}
                    required
                  />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field
                      name="changingNotGivenInfoReason"
                      component={TextField}
                      disabled={!dirty}
                      label={
                        <TranslatedText
                          stringId="mar.details.reasonForChange.label"
                          fallback="Reason for change"
                        />
                      }
                    />
                  </div>
                </>
              )}

              {marInfo?.status === ADMINISTRATION_STATUS.GIVEN && (
                <>
                  <WarningModal
                    modal={showWarningModal}
                    onClose={() => setShowWarningModal(null)}
                    onConfirm={() => {
                      setShowWarningModal(null);
                      handleSubmit(values);
                    }}
                  />
                  <Field
                    name="doseAmount"
                    component={NumberField}
                    label={
                      <TranslatedText
                        stringId="mar.details.doseGiven.label"
                        values={{ units: medication?.units }}
                        fallback={`Dose given (${medication?.units})`}
                      />
                    }
                    required
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
                    label={
                      <TranslatedText stringId="mar.details.givenBy.label" fallback="Given by" />
                    }
                    suggester={givenBySuggester}
                    required
                  />
                  <Field
                    name="recordedByUserId"
                    component={AutocompleteField}
                    label={
                      <TranslatedText
                        stringId="mar.details.recordedBy.label"
                        fallback="Recorded by"
                      />
                    }
                    suggester={recordedBySuggester}
                    required
                  />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field
                      name="reasonForChange"
                      component={TextField}
                      disabled={!dirty}
                      label={
                        <TranslatedText
                          stringId="mar.details.reasonForChange.label"
                          fallback="Reason for change"
                        />
                      }
                    />
                  </div>
                </>
              )}
              <StyledDivider />
              <ConfirmCancelRow
                onCancel={onClose}
                onConfirm={submitForm}
                confirmDisabled={!dirty}
                confirmText={
                  <TranslatedText stringId="general.action.saveChanges" fallback="Save changes" />
                }
                cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
              />
            </FormGrid>
          );
        }}
      />
    </StyledFormModal>
  );
};
