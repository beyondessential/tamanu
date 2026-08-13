import { Divider as BaseDivider, IconButton as BaseIconButton, Box } from '@material-ui/core';
import CloseIcon from '@mui/icons-material/Close';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants';
import {
  ConditionalTooltip,
  FormConfirmCancelBackRow,
  FormSubmitButton,
  MODAL_PADDING_LEFT_AND_RIGHT,
  MODAL_PADDING_TOP_AND_BOTTOM,
  TranslatedReferenceData,
  TranslatedText,
  useSettings,
} from '@tamanu/ui-components';
import { SmallBodyText } from '../components';
import { DefaultFormScreen } from '../components/Field';
import { Colors, PATIENT_STATUS } from '../constants';
import { useAuth } from '../contexts/Auth';
import { useEncounter } from '../contexts/Encounter';
import { getPatientStatus } from '../utils/getPatientStatus';

export const Divider = styled(BaseDivider)`
  margin: 30px -${MODAL_PADDING_LEFT_AND_RIGHT}px;
`;

const IconButton = styled(BaseIconButton)`
  position: absolute;
  top: 14px;
  right: 14px;
`;

const ConfirmContent = styled.div`
  text-align: left;
  padding: ${40 - MODAL_PADDING_TOP_AND_BOTTOM}px ${80 - MODAL_PADDING_LEFT_AND_RIGHT}px;
  h3 {
    color: ${Colors.alert};
    font-size: 16px;
    font-weight: 500;
  }
  p {
    font-size: 14px;
    font-weight: 400;
  }
`;

const UnsavedContent = styled.div`
  height: 210px;
  width: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
  margin-right: auto;
`;

const StyledDivider = styled(Divider)`
  margin: 0 -32px 10px -32px;
`;

const AlreadyOrderedContent = styled.div`
  text-align: left;
  padding: ${40 - MODAL_PADDING_TOP_AND_BOTTOM}px ${80 - MODAL_PADDING_LEFT_AND_RIGHT}px 0;
  h4 {
    font-size: 16px;
    font-weight: 500;
    margin-block: 0 8px;
  }
  p {
    font-size: 14px;
    font-weight: 400;
    color: ${Colors.textSecondary};
    margin-block: 0;
  }
`;

const AlreadyOrderedList = styled.ul`
  margin: 5px 0;
  padding-left: 25px;
  font-size: 14px;
  color: ${Colors.darkestText};
`;

export const DischargeFormScreen = props => {
  const {
    validateForm,
    onStepForward,
    setStatus,
    status,
    onCancel,
    currentDiagnoses,
    values,
    onSaveDraft,
    setShowWarningScreen,
  } = props;
  const { dirty } = useFormikContext();
  const { ability } = useAuth();
  const canWriteDischarge = ability.can('write', 'Discharge');
  const { getSetting } = useSettings();
  const { encounter } = useEncounter();

  const dischargeDiagnosisMandatory =
    getSetting('features.discharge.dischargeDiagnosisMandatory') &&
    getPatientStatus(encounter.encounterType) !== PATIENT_STATUS.OUTPATIENT;
  const isDiagnosisEmpty = !currentDiagnoses.length && dischargeDiagnosisMandatory;

  const handleStepForward = async () => {
    const formErrors = await validateForm();
    delete formErrors.isCanceled;

    if (Object.keys(formErrors).length > 0) {
      // Hacky, set to SUBMIT_ATTEMPTED status to view error before summary page
      // without hitting submit button, it works with one page only. Ideally we should
      // have Pagination form component to handle this.
      setStatus({ ...status, submitStatus: SUBMIT_ATTEMPTED_STATUS });
    } else {
      onStepForward();
    }
  };

  // Leaving with edits in hand routes to the unsaved-changes screen so the clinician can save
  // them as a draft instead of losing them; an untouched form just closes.
  const handleCancelAttempt = () => {
    if (dirty) {
      onStepForward();
      setShowWarningScreen(true);
    } else {
      onCancel();
    }
  };

  return (
    <>
      <IconButton onClick={handleCancelAttempt} data-testid="iconbutton-h244">
        <CloseIcon data-testid="closeicon-ggbt" />
      </IconButton>
      <DefaultFormScreen
        customBottomRow={
          <FormConfirmCancelBackRow
            onCancel={handleCancelAttempt}
            onConfirm={handleStepForward}
            CustomConfirmButton={props => (
              <ConditionalTooltip
                visible={isDiagnosisEmpty}
                title={
                  <SmallBodyText maxWidth={135} fontWeight={400} data-testid="smallbodytext-cujc">
                    <TranslatedText
                      stringId="discharge.diagnosisMustBeRecord.tooltip"
                      fallback="Diagnosis must be recorded to finalise discharge"
                    />
                  </SmallBodyText>
                }
                data-testid="conditionaltooltip-d52d"
              >
                <FormSubmitButton {...props} data-testid="styledformsubmitbutton-b274">
                  <Box whiteSpace="nowrap" data-testid="box-p5wr">
                    <TranslatedText
                      stringId="general.action.finaliseDischarge"
                      fallback="Finalise discharge"
                    />
                  </Box>
                </FormSubmitButton>
              </ConditionalTooltip>
            )}
            confirmDisabled={isDiagnosisEmpty}
            cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
            {...(canWriteDischarge && { onBack: () => onSaveDraft(values) })}
            backButtonText={
              <TranslatedText stringId="general.action.saveAndExit" fallback="Save & exit" />
            }
            data-testid="formconfirmcancelbackrow-xkrs"
          />
        }
        {...props}
        data-testid="defaultformscreen-0jje"
      />
    </>
  );
};

export const DischargeSummaryScreen = ({
  onStepBack,
  submitForm,
  onCancel,
  alreadyOrderedMedications = [],
  alreadyOrderedConfirmationTimeout,
}) => (
  <div className="ConfirmContent">
    {alreadyOrderedMedications.length > 0 && (
      <AlreadyOrderedContent data-testid="alreadyorderedcontent-fj3p">
        <h4>
          {alreadyOrderedConfirmationTimeout === 1 ? (
            <TranslatedText
              stringId="pharmacyOrder.orderConfirmation.message.singleHour"
              fallback="The above medications have already been sent within the past hour"
            />
          ) : (
            <TranslatedText
              stringId="pharmacyOrder.orderConfirmation.message.multipleHours"
              fallback="The above medications have already been sent within the past :medicationAlreadyOrderedConfirmationTimeout hours"
              replacements={{
                medicationAlreadyOrderedConfirmationTimeout: alreadyOrderedConfirmationTimeout,
              }}
            />
          )}
        </h4>
        <AlreadyOrderedList>
          {alreadyOrderedMedications.map(({ id, medication }) => (
            <li key={id}>
              <TranslatedReferenceData
                fallback={medication.name}
                value={medication.id}
                category={medication.type}
              />
            </li>
          ))}
        </AlreadyOrderedList>
        <p>
          <TranslatedText
            stringId="pharmacyOrder.orderConfirmation.secondaryMessage"
            fallback="Please confirm that you would like to proceed with including these items in your order. Please click 'Back' if you would like to amend your order."
          />
        </p>
      </AlreadyOrderedContent>
    )}
    <ConfirmContent data-testid="confirmcontent-bhoj">
      <h3>
        <TranslatedText
          stringId="discharge.modal.confirm.heading"
          fallback="Confirm patient discharge"
        />
      </h3>
      <p>
        <TranslatedText
          stringId="discharge.modal.confirm.warningText"
          fallback="Are you sure you want to discharge the patient? This action is irreversible."
        />
      </p>
    </ConfirmContent>
    <Divider data-testid="divider-67lg" />
    <FormConfirmCancelBackRow
      onBack={onStepBack}
      onConfirm={submitForm}
      onCancel={onCancel}
      data-testid="formconfirmcancelbackrow-ttpv"
    />
  </div>
);

export const UnsavedChangesScreen = ({ onDiscardDraft, onSaveDraft, values, onStepBack }) => {
  const { ability } = useAuth();
  const canWriteDischarge = ability.can('write', 'Discharge');
  const onSave = async () => {
    await onSaveDraft(values);
  };
  return (
    <div>
      <IconButton onClick={onStepBack} data-testid="iconbutton-r4jg">
        <CloseIcon data-testid="closeicon-nkjl" />
      </IconButton>
      <UnsavedContent data-testid="unsavedcontent-lqwq">
        <TranslatedText
          stringId="discharge.modal.unsavedChanges.message"
          fallback="You have unsaved changes. Are you sure you would like to discard these changes or would you like to 'Save & exit'?"
        />
      </UnsavedContent>
      <StyledDivider data-testid="styleddivider-0thc" />
      <FormConfirmCancelBackRow
        onConfirm={onDiscardDraft}
        confirmText={
          <Box whiteSpace="nowrap" data-testid="box-gxxv">
            <TranslatedText stringId="general.action.discardChanges" fallback="Discard changes" />
          </Box>
        }
        onCancel={onStepBack}
        cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        {...(canWriteDischarge && { onBack: onSave })}
        backButtonText={
          <TranslatedText stringId="general.action.saveAndExit" fallback="Save & exit" />
        }
        data-testid="formconfirmcancelbackrow-8nre"
      />
    </div>
  );
};
