import React from 'react';

import { diagnosisCertainty } from '../constants';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import {
  Form,
  Field,
  SelectField,
  CheckField,
  TextField,
  AutocompleteField,
  NumberField,
  DateField,
} from '../components/Field';

const drugRouteOptions = [
  { label: "Dermal", value: "dermal" },
  { label: "Ear", value: "ear" },
  { label: "Eye", value: "eye" },
  { label: "IM", value: "intramuscular" },
  { label: "IV", value: "intravenous" },
  { label: "Inhaled", value: "inhaled" },
  { label: "Nasal", value: "nasal" },
  { label: "Oral", value: "oral" },
  { label: "Rectal", value: "rectal" },
  { label: "S/C", value: "subcutaneous" },
  { label: "Sublingual", value: "sublingual" },
  { label: "Topical", value: "topical" },
  { label: "Vaginal", value: "vaginal" },
];

export const MedicationForm = React.memo(
  ({
    onCancel,
    onSubmit,
    drugSuggester,
    practitionerSuggester,
  }) => (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: new Date(),
        qtyMorning: 0,
        qtyLunch: 4,
        qtyEvening: 0,
        qtyNight: 0,
      }}
      render={({ submitForm }) => (
        <FormGrid>
          <Field
            name="medication._id"
            label="Medication"
            component={AutocompleteField}
            suggester={drugSuggester}
            required
          />
          <Field
            name="prescriber._id"
            label="Prescriber"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="prescription"
            label="Prescription"
            component={TextField}
            required
          />
          <Field
            name="route"
            label="Route of administration"
            component={SelectField}
            options={drugRouteOptions}
            required
          />
          <Field name="date" label="Prescription date" component={DateField} required />
          <Field name="endDate" label="End date" component={DateField} required />
          <Field name="notes" label="Notes" component={TextField} required style={{ gridColumn: '1/-1' }} />
          <FormGrid>
            <h3 style={{ gridColumn: '1/-1' }}>Quantity</h3>
            <Field name="qtyMorning" label="Morning" component={NumberField} required />
            <Field name="qtyLunch" label="Lunch" component={NumberField} required />
            <Field name="qtyEvening" label="Evening" component={NumberField} required />
            <Field name="qtyNight" label="Night" component={NumberField} required />
          </FormGrid>
          <Field name="indication" label="Indication" component={TextField} />
          <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  ),
);
