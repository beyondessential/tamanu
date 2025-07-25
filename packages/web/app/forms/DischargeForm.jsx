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
import { useTranslation } from '../contexts/Translation';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { MedicationDiscontinueModal } from '../components/Medication/MedicationDiscontinueModal';
import { usePatientOngoingPrescriptionsQuery } from '../api/queries/usePatientOngoingPrescriptionsQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useEncounterMedicationQuery } from '../api/queries/useEncounterMedicationQuery';

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

const MedicationContainer = styled(Box)`
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
`;

const DarkestText = styled(Box)`
  color: ${Colors.darkestText};
  font-size: 14px;
`;

const MedicationHeader = styled(Box)`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.darkestText};
  padding: 12px 20px;
  line-height: 18px;
`;

const TableContainer = styled(Box)`
  padding: 20px;
  padding-bottom: 15px;
  .MuiTable-root {
    border: none;
  }
  .MuiTableHead-root {
    background-color: ${Colors.white};
    .MuiTableCell-head {
      padding: 0 30px 5px 0;
      text-align: left;
      font-size: 14px;
      font-weight: 500;
      line-height: 18px;
      color: ${Colors.darkText};
      &:nth-child(4) {
        padding-right: 0;
      }
    }
  }
  .MuiTableBody-root {
    .MuiTableCell-body {
      padding: 5px 30px 0 0;
      border: none;
      &:nth-child(4),
      &:nth-child(5) {
        padding-right: 0;
      }
      ${({ $isEmpty }) =>
        $isEmpty &&
        `
        padding: 0;
        padding-top: 15px;
      `}
    }
  }
`;

const dischargingClinicianLabel = (
  <TranslatedText
    stringId="general.dischargingClinician.label"
    fallback="Discharging :clinician"
    replacements={{
      clinician: (
        <TranslatedText
          stringId="general.localisedField.clinician.label"
          fallback="Clinician"
          data-testid="translatedtext-q0hb"
        />
      ),
    }}
    data-testid="translatedtext-buzh"
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
  <StyledUnorderedList data-testid="styledunorderedlist-g4mq">
    {procedures.length > 0 ? (
      procedures.map(({ procedureType }) => (
        <li key={procedureType.id}>
          <TranslatedReferenceData
            fallback={procedureType.name}
            value={procedureType.id}
            category={procedureType.type}
            data-testid={`translatedreferencedata-yta7-${procedureType.code}`}
          />
        </li>
      ))
    ) : (
      <TranslatedText
        stringId="general.fallback.notApplicable"
        fallback="N/A"
        data-testid="translatedtext-9pcc"
      />
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
    data-testid="styledtextfield-4ea9"
  />
);

const MedicationAccessor = ({ medication, getTranslation, getEnumTranslation }) => {
  const { medication: medicationReferenceData } = medication;
  return (
    <Box>
      <DarkestText>
        <TranslatedReferenceData
          fallback={medicationReferenceData.name}
          value={medicationReferenceData.id}
          category={medicationReferenceData.type}
        />
      </DarkestText>
      <Box fontSize={'14px'} color={Colors.midText}>
        {getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation)},{' '}
        {getTranslatedFrequency(medication.frequency, getTranslation)}
      </Box>
    </Box>
  );
};
const OngoingAccessor = ({ isOngoing }) => (
  <DarkestText>
    {isOngoing ? (
      <TranslatedText stringId="general.yes" fallback="Yes" />
    ) : (
      <TranslatedText stringId="general.no" fallback="No" />
    )}
  </DarkestText>
);
const DiscontinuedAccessor = ({ medication, handleDiscontinueMedication }) => (
  <DarkestText
    style={{ textDecoration: 'underline', cursor: 'pointer' }}
    onClick={() => handleDiscontinueMedication(medication)}
  >
    <TranslatedText stringId="discharge.table.discontinue" fallback="Discontinue" />
  </DarkestText>
);

const MEDICATION_COLUMNS = (
  getTranslation,
  getEnumTranslation,
  handleDiscontinueMedication,
  canUpdateMedication,
) => [
  {
    key: 'medication',
    title: (
      <TranslatedText
        stringId="discharge.table.column.medication"
        fallback="Medication"
        data-testid="translatedtext-qyha"
      />
    ),
    accessor: medication => (
      <MedicationAccessor
        medication={medication}
        getTranslation={getTranslation}
        getEnumTranslation={getEnumTranslation}
      />
    ),
    width: '250px',
  },
  {
    key: 'quantity',
    title: (
      <TranslatedText
        stringId="discharge.table.column.dischargeQuantity"
        fallback="Discharge qty"
        data-testid="translatedtext-8e5k"
      />
    ),
    accessor: ({ id }) => (
      <Field
        name={`medications.${id}.quantity`}
        component={NumberFieldWithoutLabel}
        data-testid="field-ksmf"
        disabled={!canUpdateMedication}
      />
    ),
    width: '120px',
  },
  {
    key: 'repeats',
    title: (
      <TranslatedText
        stringId="discharge.table.column.repeats"
        fallback="Repeats"
        data-testid="translatedtext-opjr"
      />
    ),
    accessor: ({ id }) => (
      <Field
        name={`medications.${id}.repeats`}
        isClearable={false}
        component={TranslatedSelectField}
        enumValues={REPEATS_LABELS}
        data-testid="field-ium3"
        disabled={!canUpdateMedication}
      />
    ),
    width: '120px',
  },
  {
    key: 'Ongoing',
    title: <TranslatedText stringId="discharge.table.column.ongoing" fallback="Ongoing" />,
    accessor: OngoingAccessor,
    width: '60px',
  },
  ...(canUpdateMedication
    ? [
        {
          key: 'Discontinued',
          title: '',
          accessor: medication => (
            <DiscontinuedAccessor
              medication={medication}
              handleDiscontinueMedication={handleDiscontinueMedication}
            />
          ),
          width: '75px',
        },
      ]
    : []),
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
          <TranslatedText
            stringId="discharge.admissionDate.label"
            fallback="Admission date"
            data-testid="translatedtext-gkby"
          />
        }
        value={startDate}
        disabled
        data-testid="datetimeinput-4c61"
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
                  data-testid="translatedtext-67df"
                />
              ),
            }}
            data-testid="translatedtext-62et"
          />
        }
        value={examiner ? examiner.displayName : '-'}
        disabled
        data-testid="textinput-f322"
      />
      <TextInput
        label={
          <TranslatedText
            stringId="encounter.reasonForEncounter.label"
            fallback="Reason for encounter"
            data-testid="translatedtext-v2va"
          />
        }
        value={reasonForEncounter}
        disabled
        style={{ gridColumn: '1 / -1' }}
        data-testid="textinput-11vp"
      />
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="general.diagnosis.label"
            fallback="Diagnosis"
            data-testid="translatedtext-320n"
          />
        }
        style={{ gridColumn: '1 / -1' }}
        data-testid="outerlabelfieldwrapper-2u7q"
      >
        {!currentDiagnoses.length && dischargeDiagnosisMandatory ? (
          <BodyText color={Colors.alert} data-testid="bodytext-lhri">
            <TranslatedText
              stringId="discharge.diagnosis.empty"
              fallback="No diagnosis recorded. A diagnosis must be recorded in order to finalise a discharge."
              data-testid="translatedtext-ajd4"
            />
          </BodyText>
        ) : (
          <DiagnosisList diagnoses={currentDiagnoses} data-testid="diagnosislist-ytbf" />
        )}
      </OuterLabelFieldWrapper>
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="discharge.procedures.label"
            fallback="Procedures"
            data-testid="translatedtext-3s6j"
          />
        }
        style={{ gridColumn: '1 / -1' }}
        data-testid="outerlabelfieldwrapper-qzw5"
      >
        <ProcedureList procedures={procedures} data-testid="procedurelist-m4o9" />
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
      <IconButton onClick={handleCancelAttempt} data-testid="iconbutton-h244">
        <CloseIcon data-testid="closeicon-ggbt" />
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
                  <SmallBodyText maxWidth={135} fontWeight={400} data-testid="smallbodytext-cujc">
                    <TranslatedText
                      stringId="discharge.diagnosisMustBeRecord.tooltip"
                      fallback="Diagnosis must be recorded to finalise discharge"
                      data-testid="translatedtext-562y"
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
                      data-testid="translatedtext-afge"
                    />
                  </Box>
                </FormSubmitButton>
              </ConditionalTooltip>
            )}
            confirmDisabled={isDiagnosisEmpty}
            cancelText={
              <TranslatedText
                stringId="general.action.cancel"
                fallback="Cancel"
                data-testid="translatedtext-2w8k"
              />
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

const DischargeSummaryScreen = ({ onStepBack, submitForm, onCancel }) => (
  <div className="ConfirmContent">
    <ConfirmContent data-testid="confirmcontent-bhoj">
      <h3>
        <TranslatedText
          stringId="discharge.modal.confirm.heading"
          fallback="Confirm patient discharge"
          data-testid="translatedtext-vfv1"
        />
      </h3>
      <p>
        <TranslatedText
          stringId="discharge.modal.confirm.warningText"
          fallback="Are you sure you want to discharge the patient? This action is irreversible."
          data-testid="translatedtext-4o2r"
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

const UnsavedChangesScreen = ({ onCancel, onSubmit, values, onStepBack }) => {
  const { ability } = useAuth();
  const canWriteDischarge = ability.can('write', 'Discharge');
  const onSave = async () => {
    await onSubmit({ ...values, isDischarged: false });
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
          data-testid="translatedtext-774e"
        />
      </UnsavedContent>
      <StyledDivider data-testid="styleddivider-0thc" />
      <FormConfirmCancelBackRow
        onConfirm={onCancel}
        confirmText={
          <Box whiteSpace="nowrap" data-testid="box-gxxv">
            <TranslatedText
              stringId="general.action.discardChanges"
              fallback="Discard changes"
              data-testid="translatedtext-nd4x"
            />
          </Box>
        }
        onCancel={onStepBack}
        cancelText={
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid="translatedtext-cw71"
          />
        }
        {...(canWriteDischarge && { onBack: onSave })}
        backButtonText={
          <TranslatedText
            stringId="general.action.saveAndExit"
            fallback="Save & exit"
            data-testid="translatedtext-6xd9"
          />
        }
        data-testid="formconfirmcancelbackrow-8nre"
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
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const { getSetting } = useSettings();
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const canUpdateMedication = ability.can('write', 'Medication');

  const [dischargeNotes, setDischargeNotes] = useState([]);
  const [showWarningScreen, setShowWarningScreen] = useState(false);
  const [discontinuedMedication, setDiscontinuedMedication] = useState(null);
  const api = useApi();
  const { getLocalisedSchema } = useLocalisedSchema();
  const dischargeNoteMandatory = getSetting('features.discharge.dischargeNoteMandatory');
  // Only display diagnoses that don't have a certainty of 'error' or 'disproven'
  const currentDiagnoses = encounter.diagnoses.filter(
    d => !['error', 'disproven'].includes(d.certainty),
  );

  const { data: encounterMedications } = useEncounterMedicationQuery(encounter.id);
  const { data: ongoingPrescriptions } = usePatientOngoingPrescriptionsQuery(encounter.patientId);

  const activeMedications =
    encounterMedications?.data?.filter(medication => !medication.discontinued) || [];
  const onGoingMedications = ongoingPrescriptions?.data?.filter(p => !p.discontinued) || [];
  const medicationInitialValues = getMedicationsInitialValues(
    [...activeMedications, ...onGoingMedications],
    encounter,
  );
  const handleSubmit = useCallback(
    async ({ isDischarged = true, ...data }) => {
      if (isDischarged) {
        await onSubmit(data);
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
          data-testid="translatedtext-os9t"
        />,
      );
      return;
    }
    onTitleChange(
      <TranslatedText
        stringId="discharge.modal.title"
        fallback="Discharge patient"
        data-testid="translatedtext-juk1"
      />,
    );
  }, [showWarningScreen, onTitleChange]);

  const handleDiscontinueMedication = medication => {
    setDiscontinuedMedication(medication);
  };

  const onDiscontinueMedication = () => {
    queryClient.invalidateQueries(['patient-ongoing-prescriptions', encounter.patientId]);
    queryClient.invalidateQueries(['encounterMedication', encounter.id]);
  };

  return (
    <>
      <PaginatedForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        initialValues={getDischargeInitialValues(
          encounter,
          dischargeNotes,
          medicationInitialValues,
        )}
        FormScreen={props => (
          <DischargeFormScreen
            {...props}
            currentDiagnoses={currentDiagnoses}
            onSubmit={handleSubmit}
            setShowWarningScreen={setShowWarningScreen}
            data-testid="dischargeformscreen-z2zo"
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
                  data-testid="unsavedchangesscreen-o64o"
                />
              )
        }
        validationSchema={yup.object().shape({
          endDate: yup
            .date()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="discharge.dischargeDate.label"
                fallback="Discharge date"
                data-testid="translatedtext-542l"
              />,
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
                      data-testid="translatedtext-208f"
                    />,
                  )
                : yup.string().optional(),
            })
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="general.localisedField.dischargeDisposition.label"
                fallback="Discharge disposition"
                data-testid="translatedtext-5ib8"
              />,
            ),
        })}
        formProps={{
          enableReinitialize: true,
          showInlineErrorsOnly: true,
          validateOnChange: true,
        }}
        data-testid="paginatedform-ghn7"
      >
        <FormGrid data-testid="formgrid-menu">
          <EncounterOverview
            encounter={encounter}
            currentDiagnoses={currentDiagnoses}
            data-testid="encounteroverview-1swb"
          />
          <Field
            name="endDate"
            label={
              <TranslatedText
                stringId="discharge.dischargeDate.label"
                fallback="Discharge date"
                data-testid="translatedtext-mhlm"
              />
            }
            component={DateTimeField}
            min={format(encounter.startDate, "yyyy-MM-dd'T'HH:mm")}
            required
            saveDateAsString
            data-testid="field-20tt"
          />
          <Field
            name="discharge.dischargerId"
            label={dischargingClinicianLabel}
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
            data-testid="field-6we6"
          />
          <LocalisedField
            name="discharge.dispositionId"
            label={
              <TranslatedText
                stringId="general.localisedField.dischargeDisposition.label"
                fallback="Discharge disposition"
                data-testid="translatedtext-scxc"
              />
            }
            path="fields.dischargeDisposition"
            component={AutocompleteField}
            suggester={dispositionSuggester}
            data-testid="localisedfield-d7fu"
          />
          <OuterLabelFieldWrapper
            label={
              <TranslatedText
                stringId="discharge.medications.label"
                fallback="Medications"
                data-testid="translatedtext-6d1o"
              />
            }
            style={{ gridColumn: '1 / -1' }}
            data-testid="outerlabelfieldwrapper-axm9"
          >
            <MedicationContainer>
              <MedicationHeader borderBottom={`1px solid ${Colors.outline}`}>
                <TranslatedText
                  stringId="discharge.encounterMedication"
                  fallback="Encounter medication"
                />
              </MedicationHeader>
              <TableContainer $isEmpty={activeMedications.length === 0}>
                <TableFormFields
                  columns={MEDICATION_COLUMNS(
                    getTranslation,
                    getEnumTranslation,
                    handleDiscontinueMedication,
                    canUpdateMedication,
                  )}
                  data={activeMedications}
                  data-testid="tableformfields-i8q7"
                />
              </TableContainer>
              <MedicationHeader
                borderTop={`1px solid ${Colors.outline}`}
                borderBottom={`1px solid ${Colors.outline}`}
              >
                <TranslatedText
                  stringId="discharge.otherOngoingMedication"
                  fallback="Other ongoing medication"
                />
              </MedicationHeader>
              <TableContainer $isEmpty={onGoingMedications.length === 0}>
                <TableFormFields
                  columns={MEDICATION_COLUMNS(
                    getTranslation,
                    getEnumTranslation,
                    handleDiscontinueMedication,
                    canUpdateMedication,
                  )}
                  data={onGoingMedications}
                  data-testid="tableformfields-i8q7"
                />
              </TableContainer>
            </MedicationContainer>
          </OuterLabelFieldWrapper>
          <Field
            name="sendToPharmacy"
            label={
              <TranslatedText
                stringId="discharge.sendToPharmacy.label"
                fallback="Send prescription to pharmacy"
                data-testid="translatedtext-h7xy"
              />
            }
            component={CheckField}
            helperText={
              <TranslatedText
                stringId="discharge.sendToPharmacy.helperText"
                fallback="Requires mSupply"
                data-testid="translatedtext-kjqf"
              />
            }
            style={{ gridColumn: '1 / -1' }}
            disabled
            data-testid="field-cxfn"
          />
          <Field
            name="discharge.note"
            label={
              <TranslatedText
                stringId="discharge.notes.label"
                fallback="Discharge treatment plan and follow-up notes"
                data-testid="translatedtext-kr28"
              />
            }
            component={TextField}
            multiline
            minRows={4}
            style={{ gridColumn: '1 / -1' }}
            required={dischargeNoteMandatory}
            data-testid="field-0uma"
          />
          <Divider
            style={{ margin: '18px -32px 20px -32px', gridColumn: '1 / -1' }}
            data-testid="divider-lj2w"
          />
        </FormGrid>
      </PaginatedForm>
      {!!discontinuedMedication && (
        <MedicationDiscontinueModal
          medication={discontinuedMedication}
          onDiscontinue={onDiscontinueMedication}
          onClose={() => setDiscontinuedMedication(null)}
        />
      )}
    </>
  );
};
