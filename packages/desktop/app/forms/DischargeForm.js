import React, { useCallback, useState, useEffect } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { range } from 'lodash';
import { isFuture, parseISO, set } from 'date-fns';
import { format, getCurrentDateTimeString, toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Divider as BaseDivider } from '@material-ui/core';
import { Colors, FORM_STATUSES } from '../constants';
import { useApi } from '../api';
import { foreignKey } from '../utils/validation';

import {
  Field,
  AutocompleteField,
  TextField,
  CheckField,
  StyledTextField,
  LocalisedField,
  useLocalisedSchema,
  CheckControl,
  SelectField,
  PaginatedForm,
  DefaultFormScreen,
} from '../components/Field';
import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { DateTimeField, DateTimeInput } from '../components/Field/DateField';
import { TextInput } from '../components/Field/TextField';
import { FormGrid } from '../components/FormGrid';
import { TableFormFields } from '../components/Table';

import { ConfirmCancelBackRow, ConfirmCancelRow } from '../components/ButtonRow';
import { DiagnosisList } from '../components/DiagnosisList';
import { useEncounter } from '../contexts/Encounter';
import {
  MODAL_PADDING_LEFT_AND_RIGHT,
  MODAL_PADDING_TOP_AND_BOTTOM,
  useLocalisedText,
} from '../components';

const Divider = styled(BaseDivider)`
  margin: 30px -${MODAL_PADDING_LEFT_AND_RIGHT}px;
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

const MAX_REPEATS = 12;
const REPEATS_OPTIONS = range(MAX_REPEATS + 1).map(value => ({ label: value, value }));

const getDischargeInitialValues = (encounter, dischargeNotePages, medicationInitialValues) => {
  const today = new Date();
  const encounterStartDate = parseISO(encounter.startDate);
  return {
    endDate: isFuture(encounterStartDate)
      ? // In the case of a future start_date we cannot default to current datetime as it falls outside of the min date.
        toDateTimeString(
          set(encounterStartDate, {
            hours: today.getHours(),
            minutes: today.getMinutes(),
            seconds: today.getSeconds(),
          }),
        )
      : getCurrentDateTimeString(),
    discharge: {
      note: dischargeNotePages.map(np => np.noteItems?.[0]?.content).join('\n'),
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
const getMedicationsInitialValues = medications => {
  const medicationsInitialValues = {};

  medications.forEach(medication => {
    const key = medication.id;
    medicationsInitialValues[key] = {
      isDischarge: true,
      quantity: medication.quantity || 0,
      repeats: 0,
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
    {procedures.length > 0
      ? procedures.map(({ procedureType }) => <li key={procedureType.id}>{procedureType.name}</li>)
      : 'N/a'}
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
    lineOne={medication.name}
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
    component={SelectField}
    options={REPEATS_OPTIONS}
  />
);

const medicationColumns = [
  {
    key: 'drug/prescription',
    title: 'Drug / Prescription',
    accessor: MedicationAccessor,
  },
  { key: 'quantity', title: 'Discharge Quantity', accessor: QuantityAccessor, width: '20%' },
  { key: 'repeats', title: 'Repeats', accessor: RepeatsAccessor, width: '20%' },
];

const EncounterOverview = ({
  encounter: { procedures, diagnoses, startDate, examiner, reasonForEncounter },
}) => {
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

  // Only display diagnoses that don't have a certainty of 'error' or 'disproven'
  const currentDiagnoses = diagnoses.filter(d => !['error', 'disproven'].includes(d.certainty));

  return (
    <>
      <DateTimeInput label="Admission date" value={startDate} disabled />
      <TextInput
        label={`Supervising ${clinicianText.toLowerCase()}`}
        value={examiner ? examiner.displayName : '-'}
        disabled
      />
      <TextInput
        label="Reason for encounter"
        value={reasonForEncounter}
        disabled
        style={{ gridColumn: '1 / -1' }}
      />
      <OuterLabelFieldWrapper label="Diagnoses" style={{ gridColumn: '1 / -1' }}>
        <DiagnosisList diagnoses={currentDiagnoses} />
      </OuterLabelFieldWrapper>
      <OuterLabelFieldWrapper label="Procedures" style={{ gridColumn: '1 / -1' }}>
        <ProcedureList procedures={procedures} />
      </OuterLabelFieldWrapper>
    </>
  );
};

const DischargeFormScreen = props => {
  const { validateForm, onStepForward, setStatus, status, onCancel } = props;

  return (
    <DefaultFormScreen
      customBottomRow={
        <ConfirmCancelRow
          onCancel={onCancel}
          onConfirm={async () => {
            const { isCanceled, ...formErrors } = await validateForm();
            if (Object.keys(formErrors).length > 0) {
              // Hacky, set to SUBMIT_ATTEMPTED status to view error before summary page
              // without hitting submit button, it works with one page only. Ideally we should
              // have Pagination form component to handle this.
              setStatus({ ...status, submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED });
            } else {
              onStepForward();
            }
          }}
          confirmText="Finalise"
          cancelText="Cancel"
        />
      }
      {...props}
    />
  );
};

const DischargeSummaryScreen = ({ onStepBack, submitForm, onCancel }) => (
  <div className="ConfirmContent">
    <ConfirmContent>
      <h3>Confirm patient discharge</h3>
      <p>Are you sure you want to discharge the patient? This action is irreversible.</p>
    </ConfirmContent>
    <Divider />
    <ConfirmCancelBackRow onBack={onStepBack} onConfirm={submitForm} onCancel={onCancel} />
  </div>
);

export const DischargeForm = ({
  dispositionSuggester,
  practitionerSuggester,
  onCancel,
  onSubmit,
}) => {
  const { encounter } = useEncounter();
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
  const [dischargeNotePages, setDischargeNotePages] = useState([]);
  const api = useApi();
  const { getLocalisedSchema } = useLocalisedSchema();

  // Only display medications that are not discontinued
  // Might need to update condition to compare by end date (decision pending)
  const activeMedications = encounter.medications?.filter(medication => !medication.discontinued);
  const medicationInitialValues = getMedicationsInitialValues(activeMedications);
  const handleSubmit = useCallback(
    ({ medications, ...data }) => {
      // Filter out medications that weren't marked
      const filteredMedications = {};
      Object.keys(medications).forEach(id => {
        const medication = medications[id];
        if (medication.isDischarge) filteredMedications[id] = medication;
      });

      onSubmit({ ...data, medications: filteredMedications });
    },
    [onSubmit],
  );

  useEffect(() => {
    (async () => {
      const { data: notePages } = await api.get(`encounter/${encounter.id}/notePages`);
      setDischargeNotePages(notePages.filter(n => n.noteType === 'discharge'));
    })();
  }, [api, encounter.id]);

  return (
    <PaginatedForm
      onSubmit={handleSubmit}
      onCancel={onCancel}
      initialValues={getDischargeInitialValues(
        encounter,
        dischargeNotePages,
        medicationInitialValues,
      )}
      FormScreen={DischargeFormScreen}
      SummaryScreen={DischargeSummaryScreen}
      validationSchema={yup.object().shape({
        endDate: yup.date().required(),
        discharge: yup
          .object()
          .shape({
            dischargerId: foreignKey(
              `Discharging ${clinicianText.toLowerCase()} is a required field'`,
            ),
          })
          .shape({
            dispositionId: getLocalisedSchema({
              name: 'dischargeDisposition',
            }),
          })
          .required(),
      })}
      formProps={{ enableReinitialize: true, showInlineErrorsOnly: true, validateOnChange: true }}
    >
      <FormGrid>
        <EncounterOverview encounter={encounter} />
        <Field
          name="endDate"
          label="Discharge date"
          component={DateTimeField}
          min={format(encounter.startDate, "yyyy-MM-dd'T'HH:mm")}
          required
          saveDateAsString
        />
        <Field
          name="discharge.dischargerId"
          label={clinicianText}
          component={AutocompleteField}
          suggester={practitionerSuggester}
          required
        />
        <LocalisedField
          name="discharge.dispositionId"
          path="fields.dischargeDisposition"
          component={AutocompleteField}
          suggester={dispositionSuggester}
        />
        <OuterLabelFieldWrapper label="Discharge medications" style={{ gridColumn: '1 / -1' }}>
          <TableFormFields columns={medicationColumns} data={activeMedications} />
        </OuterLabelFieldWrapper>
        <Field
          name="sendToPharmacy"
          label="Send prescription to pharmacy"
          component={CheckField}
          helperText="Requires mSupply"
          style={{ gridColumn: '1 / -1' }}
          disabled
        />
        <Field
          name="discharge.note"
          label="Discharge treatment plan and follow-up notes"
          component={TextField}
          multiline
          rows={4}
          style={{ gridColumn: '1 / -1' }}
        />
      </FormGrid>
    </PaginatedForm>
  );
};
