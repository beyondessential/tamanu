import React, { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { REPEATS_LABELS } from '@tamanu/constants';
import CloseIcon from '@material-ui/icons/Close';
import { isFuture, parseISO, set } from 'date-fns';
import { format, getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
import { Divider as BaseDivider, Box, IconButton as BaseIconButton } from '@material-ui/core';
import { Colors, FORM_STATUSES, FORM_TYPES } from '../constants';
import { useApi } from '../api';
import { foreignKey } from '../utils/validation';

import {
  AutocompleteField,
  CheckControl,
  CheckField,
  DefaultFormScreen,
  Field,
  LocalisedField,
  PaginatedForm,
  StyledTextField,
  TextField,
  TranslatedSelectField,
  useLocalisedSchema,
} from '../components/Field';
import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { DateTimeField, DateTimeInput } from '../components/Field/DateField';
import { TextInput } from '../components/Field/TextField';
import { FormGrid } from '../components/FormGrid';
import { TableFormFields } from '../components/Table';

import { FormConfirmCancelBackRow } from '../components/ButtonRow';
import { DiagnosisList } from '../components/DiagnosisList';
import { useEncounter } from '../contexts/Encounter';
import {
  BodyText,
  FormSubmitButton,
  MODAL_PADDING_LEFT_AND_RIGHT,
  MODAL_PADDING_TOP_AND_BOTTOM,
  SmallBodyText,
} from '../components';
import { TranslatedText, TranslatedReferenceData } from '../components/Translation';
import { useSettings } from '../contexts/Settings';
import { ConditionalTooltip } from '../components/Tooltip';
import { useAuth } from '../contexts/Auth';

const Divider = styled(BaseDivider)`
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

const dischargingClinicianLabel = (
  <TranslatedText
    stringId="general.dischargingClinician.label"
    fallback="Discharging :clinician"
    replacements={{
      clinician: (
        <TranslatedText stringId="general.localisedField.clinician.label" fallback="Clinician" />
      ),
    }}
  />
);

const getDischargeInitialValues = (encounter, dischargeNotes, medicationInitialValues) => {
  const dischargeDraft = encounter?.dischargeDraft?.discharge;
  const today = new Date();
  const encounterStartDate = parseISO(encounter.startDate);

  const getInitialEndDate = () => {
    if (!dischargeDraft) {
      if (isFuture(encounterStartDate)) {
        // In the case of a future start_date we cannot default to current datetime as it falls outside of the min date.
        return toDateTimeString(
          set(encounterStartDate, {
            hours: today.getHours(),
            minutes: today.getMinutes(),
            seconds: today.getSeconds(),
          }),
        );
      } else {
        return getCurrentDateTimeString();
      }
    }
    return encounter?.dischargeDraft?.endDate;
  };

  return {
    endDate: getInitialEndDate(),
    discharge: {
      dischargerId: dischargeDraft?.dischargerId,
      dispositionId: dischargeDraft?.dispositionId,
      note: dischargeNotes.map(n => n.content).join('\n\n'),
    },
    medications: medicationInitialValues,
    // Used in creation of associated notes
    submittedTime: getCurrentDateTimeString(),
  };
};

/*
Creates an object to add initialValues to Formik that matches
the table-like form fields.
*/
const getMedicationsInitialValues = (medications, encounter) => {
  const medicationDraft = encounter?.dischargeDraft?.medications;
  const medicationsInitialValues = {};

  medications.forEach(medication => {
    const key = medication.id;
    medicationsInitialValues[key] = {
      isDischarge: medicationDraft?.[key]?.isDischarge ?? true,
      quantity: medicationDraft?.[key]?.quantity ?? medication.quantity ?? 0,
      repeats: medicationDraft?.[key]?.repeats ?? medication?.repeats?.toString() ?? '0',
    };
  });
  return medicationsInitialValues;
};

const StyledUnorderedList = styled.ul`
  margin: 5px 0;
  padding-left: 25px;
`;

const ProcedureList = React.memo(({ procedures }) => (
  <StyledUnorderedList>
    {procedures.length > 0 ? (
      procedures.map(({ procedureType }) => (
        <li key={procedureType.id}>
          <TranslatedReferenceData
            fallback={procedureType.name}
            value={procedureType.id}
            category={procedureType.type}
          />
        </li>
      ))
    ) : (
      <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />
    )}
  </StyledUnorderedList>
));

const NumberFieldWithoutLabel = ({ field, ...props }) => (
  <StyledTextField
    name={field.name}
    value={field.value || 0}
    onChange={field.onChange}
    variant="outlined"
    type="number"
    {...props}
  />
);

const StyledFlexDiv = styled.div`
  display: flex;
`;
const StyledCheckbox = styled(CheckControl)`
  font-size: 16px;
`;
const StyledTextSpan = styled.span`
  color: ${props => (props.color ? props.color : Colors.darkText)};
`;

/*
A custom check field was needed because the label resides on
the table headers and there is a need to display two text descriptions
alongside the checkbox with different stylings.
*/
const CustomCheckField = ({ field, lineOne, lineTwo }) => (
  <StyledFlexDiv>
    <StyledCheckbox
      color="primary"
      value={field.value}
      name={field.name}
      onChange={field.onChange}
    />
    <div>
      <StyledTextSpan>{lineOne}</StyledTextSpan>
      <br />
      <StyledTextSpan color={Colors.midText}>{lineTwo}</StyledTextSpan>
    </div>
  </StyledFlexDiv>
);

const MedicationAccessor = ({ id, medication, prescription }) => (
  <Field
    name={`medications.${id}.isDischarge`}
    lineOne={
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category={medication.type}
      />
    }
    lineTwo={prescription}
    component={CustomCheckField}
  />
);
const QuantityAccessor = ({ id }) => (
  <Field name={`medications.${id}.quantity`} component={NumberFieldWithoutLabel} />
);
const RepeatsAccessor = ({ id }) => (
  <Field
    name={`medications.${id}.repeats`}
    isClearable={false}
    component={TranslatedSelectField}
    enumValues={REPEATS_LABELS}
  />
);

const medicationColumns = [
  {
    key: 'drug/prescription',
    title: (
      <TranslatedText
        stringId="discharge.table.column.drugOrPrescription"
        fallback="Drug / Prescription"
      />
    ),
    accessor: MedicationAccessor,
  },
  {
    key: 'quantity',
    title: (
      <TranslatedText
        stringId="discharge.table.column.dischargeQuantity"
        fallback="Discharge Quantity"
      />
    ),
    accessor: QuantityAccessor,
    width: '20%',
  },
  {
    key: 'repeats',
    title: <TranslatedText stringId="discharge.table.column.repeats" fallback="Repeats" />,
    accessor: RepeatsAccessor,
    width: '20%',
  },
];

const EncounterOverview = ({
  encounter: { procedures, startDate, examiner, reasonForEncounter },
  currentDiagnoses,
}) => {
  const { getSetting } = useSettings();
  const dischargeDiagnosisMandatory = getSetting('features.discharge.dischargeDiagnosisMandatory');

  return (
    <>
      <DateTimeInput
        label={
          <TranslatedText stringId="discharge.admissionDate.label" fallback="Admission date" />
        }
        value={startDate}
        disabled
      />
      <TextInput
        label={
          <TranslatedText
            stringId="general.supervisingClinician.label"
            fallback="Supervising :clinician"
            replacements={{
              clinician: (
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  casing="lower"
                />
              ),
            }}
          />
        }
        value={examiner ? examiner.displayName : '-'}
        disabled
      />
      <TextInput
        label={
          <TranslatedText
            stringId="encounter.reasonForEncounter.label"
            fallback="Reason for encounter"
          />
        }
        value={reasonForEncounter}
        disabled
        style={{ gridColumn: '1 / -1' }}
      />
      <OuterLabelFieldWrapper
        label={<TranslatedText stringId="general.diagnosis.label" fallback="Diagnosis" />}
        style={{ gridColumn: '1 / -1' }}
      >
        {!currentDiagnoses.length && dischargeDiagnosisMandatory ? (
          <BodyText color={Colors.alert}>
            <TranslatedText
              stringId="discharge.diagnosis.empty"
              fallback="No diagnosis recorded. A diagnosis must be recorded in order to finalise a discharge."
            />
          </BodyText>
        ) : (
          <DiagnosisList diagnoses={currentDiagnoses} />
        )}
      </OuterLabelFieldWrapper>
      <OuterLabelFieldWrapper
        label={<TranslatedText stringId="discharge.procedures.label" fallback="Procedures" />}
        style={{ gridColumn: '1 / -1' }}
      >
        <ProcedureList procedures={procedures} />
      </OuterLabelFieldWrapper>
    </>
  );
};

const DischargeFormScreen = props => {
  const {
    validateForm,
    onStepForward,
    setStatus,
    status,
    onCancel,
    currentDiagnoses,
    values,
    onSubmit,
  } = props;
  const { getSetting } = useSettings();

  const dischargeDiagnosisMandatory = getSetting('features.discharge.dischargeDiagnosisMandatory');
  const isDiagnosisEmpty = !currentDiagnoses.length && dischargeDiagnosisMandatory;

  const handleStepForward = async isSavedForm => {
    if (isSavedForm) {
      await onSubmit({ ...values, isDischarged: false });
      return;
    }
    const formErrors = await validateForm();
    delete formErrors.isCanceled;

    if (Object.keys(formErrors).length > 0) {
      // Hacky, set to SUBMIT_ATTEMPTED status to view error before summary page
      // without hitting submit button, it works with one page only. Ideally we should
      // have Pagination form component to handle this.
      setStatus({ ...status, submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED });
    } else {
      onStepForward();
    }
  };

  const handleCancelAttempt = () => {
    onCancel();
  };

  return (
    <>
      <IconButton onClick={handleCancelAttempt}>
        <CloseIcon />
      </IconButton>
      <DefaultFormScreen
        customBottomRow={
          <FormConfirmCancelBackRow
            onCancel={handleCancelAttempt}
            onConfirm={() => handleStepForward(false)}
            CustomConfirmButton={props => (
              <ConditionalTooltip
                visible={isDiagnosisEmpty}
                title={
                  <SmallBodyText maxWidth={135} fontWeight={400}>
                    <TranslatedText
                      stringId="discharge.diagnosisMustBeRecord.tooltip"
                      fallback="Diagnosis must be recorded to finalise discharge"
                    />
                  </SmallBodyText>
                }
              >
                <FormSubmitButton {...props}>
                  <Box whiteSpace="nowrap">
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
          />
        }
        {...props}
      />
    </>
  );
};

const DischargeSummaryScreen = ({ onStepBack, submitForm, onCancel }) => (
  <div className="ConfirmContent">
    <ConfirmContent>
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
    <Divider />
    <FormConfirmCancelBackRow onBack={onStepBack} onConfirm={submitForm} onCancel={onCancel} />
  </div>
);

const UnsavedChangesScreen = ({ onCancel, onSubmit, values, onStepBack }) => {
  const { ability } = useAuth();
  const canWriteDischarge = ability.can('write', 'Discharge');

  const onSave = async () => {
    await onSubmit({ ...values, isDischarged: false });
  };
  return (
    <div>
      <IconButton onClick={onStepBack}>
        <CloseIcon />
      </IconButton>
      <UnsavedContent>
        <TranslatedText
          stringId="discharge.modal.unsavedChanges.message"
          fallback="You have unsaved changes. Are you sure you would like to discard these changes or would you like to 'Save & exit'?"
        />
      </UnsavedContent>
      <StyledDivider />
      <FormConfirmCancelBackRow
        onConfirm={onCancel}
        confirmText={
          <Box whiteSpace="nowrap">
            <TranslatedText stringId="general.action.discardChanges" fallback="Discard changes" />
          </Box>
        }
        onCancel={onStepBack}
        cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        {...(canWriteDischarge && { onBack: onSave })}
        backButtonText={
          <TranslatedText stringId="general.action.saveAndExit" fallback="Save & exit" />
        }
      />
    </div>
  );
};

export const DischargeForm = ({
  dispositionSuggester,
  practitionerSuggester,
  onCancel,
  onSubmit,
  onTitleChange,
}) => {
  const { encounter } = useEncounter();
  const { getSetting } = useSettings();
  const [dischargeNotes, setDischargeNotes] = useState([]);
  const [showWarningScreen, setShowWarningScreen] = useState(false);
  const api = useApi();
  const { getLocalisedSchema } = useLocalisedSchema();
  const dischargeNoteMandatory = getSetting('features.discharge.dischargeNoteMandatory');
  // Only display diagnoses that don't have a certainty of 'error' or 'disproven'
  const currentDiagnoses = encounter.diagnoses.filter(
    d => !['error', 'disproven'].includes(d.certainty),
  );

  // Only display medications that are not discontinued
  // Might need to update condition to compare by end date (decision pending)
  const activeMedications = encounter.medications?.filter(medication => !medication.discontinued);
  const medicationInitialValues = getMedicationsInitialValues(activeMedications, encounter);
  const handleSubmit = useCallback(
    async ({ isDischarged = true, ...data }) => {
      const { medications } = data;
      if (isDischarged) {
        // Filter out medications that weren't marked
        const filteredMedications = {};
        Object.keys(medications).forEach(id => {
          const medication = medications[id];
          if (medication.isDischarge) filteredMedications[id] = medication;
        });

        await onSubmit({ ...data, medications: filteredMedications });
        return;
      }
      await onSubmit({ dischargeDraft: data });
    },
    [onSubmit],
  );

  useEffect(() => {
    (async () => {
      const { data: notes } = await api.get(`encounter/${encounter.id}/notes`);
      setDischargeNotes(notes.filter(n => n.noteType === 'discharge').reverse()); // reverse order of array to sort by oldest first
    })();
  }, [api, encounter.id]);

  useEffect(() => {
    if (showWarningScreen) {
      onTitleChange(
        <TranslatedText
          stringId="discharge.modal.unsavedChanges.title"
          fallback="Unsaved changes"
        />,
      );
      return;
    }
    onTitleChange(<TranslatedText stringId="discharge.modal.title" fallback="Discharge patient" />);
  }, [showWarningScreen, onTitleChange]);

  return (
    <PaginatedForm
      onSubmit={handleSubmit}
      onCancel={onCancel}
      initialValues={getDischargeInitialValues(encounter, dischargeNotes, medicationInitialValues)}
      FormScreen={props => (
        <DischargeFormScreen
          {...props}
          currentDiagnoses={currentDiagnoses}
          onSubmit={handleSubmit}
          setShowWarningScreen={setShowWarningScreen}
        />
      )}
      formType={FORM_TYPES.CREATE_FORM}
      SummaryScreen={
        !showWarningScreen
          ? DischargeSummaryScreen
          : props => (
              <UnsavedChangesScreen
                {...props}
                showWarningScreen={showWarningScreen}
                onSubmit={handleSubmit}
              />
            )
      }
      validationSchema={yup.object().shape({
        endDate: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText stringId="discharge.dischargeDate.label" fallback="Discharge date" />,
          ),
        discharge: yup
          .object()
          .shape({
            dischargerId: foreignKey().translatedLabel(dischargingClinicianLabel),
            dispositionId: getLocalisedSchema({
              name: 'dischargeDisposition',
            }),
            note: dischargeNoteMandatory
              ? foreignKey().translatedLabel(
                  <TranslatedText
                    stringId="discharge.notes.label"
                    fallback="Discharge treatment plan and follow-up notes"
                  />,
                )
              : yup.string().optional(),
          })
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.dischargeDisposition.label"
              fallback="Discharge disposition"
            />,
          ),
      })}
      formProps={{
        enableReinitialize: true,
        showInlineErrorsOnly: true,
        validateOnChange: true,
      }}
    >
      <FormGrid>
        <EncounterOverview encounter={encounter} currentDiagnoses={currentDiagnoses} />
        <Field
          name="endDate"
          label={
            <TranslatedText stringId="discharge.dischargeDate.label" fallback="Discharge date" />
          }
          component={DateTimeField}
          min={format(encounter.startDate, "yyyy-MM-dd'T'HH:mm")}
          required
          saveDateAsString
        />
        <Field
          name="discharge.dischargerId"
          label={dischargingClinicianLabel}
          component={AutocompleteField}
          suggester={practitionerSuggester}
          required
        />
        <LocalisedField
          name="discharge.dispositionId"
          label={
            <TranslatedText
              stringId="general.localisedField.dischargeDisposition.label"
              fallback="Discharge disposition"
            />
          }
          path="fields.dischargeDisposition"
          component={AutocompleteField}
          suggester={dispositionSuggester}
        />
        <OuterLabelFieldWrapper
          label={
            <TranslatedText
              stringId="discharge.dischargeMedications.label"
              fallback="Discharge medications"
            />
          }
          style={{ gridColumn: '1 / -1' }}
        >
          <TableFormFields columns={medicationColumns} data={activeMedications} />
        </OuterLabelFieldWrapper>
        <Field
          name="sendToPharmacy"
          label={
            <TranslatedText
              stringId="discharge.sendToPharmacy.label"
              fallback="Send prescription to pharmacy"
            />
          }
          component={CheckField}
          helperText={
            <TranslatedText
              stringId="discharge.sendToPharmacy.helperText"
              fallback="Requires mSupply"
            />
          }
          style={{ gridColumn: '1 / -1' }}
          disabled
        />
        <Field
          name="discharge.note"
          label={
            <TranslatedText
              stringId="discharge.notes.label"
              fallback="Discharge treatment plan and follow-up notes"
            />
          }
          component={TextField}
          multiline
          minRows={4}
          style={{ gridColumn: '1 / -1' }}
          required={dischargeNoteMandatory}
        />
        <Divider style={{ margin: '18px -32px 20px -32px', gridColumn: '1 / -1' }} />
      </FormGrid>
    </PaginatedForm>
  );
};
