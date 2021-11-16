import React, { useState, useEffect } from 'react';
import * as yup from 'yup';
import Select from 'react-select';
import styled from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';
import { range } from 'lodash';
import { Colors } from '../constants';
import { useApi } from '../api';

import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  AutocompleteField,
  TextField,
  CheckField,
  DateField,
  StyledTextField,
} from '../components/Field';
import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { DateInput } from '../components/Field/DateField';
import { TextInput } from '../components/Field/TextField';
import { FormGrid } from '../components/FormGrid';
import { TableFormFields } from '../components/Table';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { DiagnosisList } from '../components/DiagnosisList';
import { useEncounter } from '../contexts/Encounter';

const MAX_REPEATS_RANGE = 12;
const REPEATS_OPTIONS = range(MAX_REPEATS_RANGE + 1).map(value => ({ label: value, value: value }));

const StyledUnorderedList = styled.ul`
  margin: 5px 0;
  padding-left: 25px;
`;

const ProcedureList = procedures => (
  <StyledUnorderedList>
    {procedures.length > 0
      ? procedures.map(({ procedureType }) => {
          return <li key={procedureType.id}>{procedureType.name}</li>;
        })
      : 'N/a'}
  </StyledUnorderedList>
);

const SelectFieldWithoutLabel = ({ field, form, options, ...props }) => {
  const handleChange = option => form.setFieldValue(field.name, option.value);

  return (
    <Select
      name={field.name}
      value={options.find(option => option.value === field.value)}
      onChange={handleChange}
      options={options}
      menuPlacement="auto"
      menuPosition="fixed"
      menuShouldBlockScroll="true"
      {...props}
    />
  );
};

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
const StyledCheckbox = styled(Checkbox)`
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
      icon={<i className="far fa-square" />}
      checkedIcon={<i className="far fa-check-square" />}
      color="primary"
      value="checked"
      checked={field.value || false}
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
    component={SelectFieldWithoutLabel}
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
}) => (
  <React.Fragment>
    <DateInput label="Admission date" value={startDate} disabled />
    <TextInput
      label="Supervising physician"
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
      <DiagnosisList diagnoses={diagnoses} />
    </OuterLabelFieldWrapper>
    <OuterLabelFieldWrapper label="Procedures" style={{ gridColumn: '1 / -1' }}>
      <ProcedureList procedures={procedures} />
    </OuterLabelFieldWrapper>
  </React.Fragment>
);

export const DischargeForm = ({ practitionerSuggester, onCancel, onSubmit }) => {
  const { encounter } = useEncounter();
  const [dischargeNotes, setDischargeNotes] = useState([]);
  const api = useApi();

  useEffect(() => {
    (async () => {
      const { data: notes } = await api.get(`encounter/${encounter.id}/notes`);
      setDischargeNotes(notes.filter(n => n.noteType === 'discharge'));
    })();
  }, []);

  const renderForm = ({ submitForm }) => {
    return (
      <React.Fragment>
        <FormGrid>
          <EncounterOverview encounter={encounter} />
          <Field name="endDate" label="Discharge date" component={DateField} required />
          <Field
            name="discharge.dischargerId"
            label="Discharging physician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <OuterLabelFieldWrapper label="Discharge medications" style={{ gridColumn: '1 / -1' }}>
            <TableFormFields columns={medicationColumns} data={encounter.medications} />
          </OuterLabelFieldWrapper>
          <Field
            name="sendToPharmacy"
            label="Send prescription to pharmacy"
            component={CheckField}
            helperText="Requires mSupply"
            style={{ gridColumn: '1 / -1' }}
          />
          <Field
            name="discharge.note"
            label="Discharge treatment plan and follow-up notes"
            component={TextField}
            multiline
            rows={4}
            style={{ gridColumn: '1 / -1' }}
          />
          <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText="Finalise" />
        </FormGrid>
      </React.Fragment>
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      enableReinitialize
      initialValues={{
        endDate: new Date(),
        discharge: {
          note: dischargeNotes.map(n => n.content).join('\n'),
        },
      }}
      validationSchema={yup.object().shape({
        endDate: yup.date().required(),
        discharge: yup
          .object()
          .shape({
            dischargerId: foreignKey('Discharging physician is a required field'),
          })
          .required(),
      })}
    />
  );
};
