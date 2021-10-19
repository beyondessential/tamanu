import React from 'react';
import * as yup from 'yup';

import { foreignKey } from '../utils/validation';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import {
  Form,
  Field,
  SelectField,
  TextField,
  AutocompleteField,
  NumberField,
  DateField,
} from '../components/Field';

const drugRouteOptions = [
  { label: 'Dermal', value: 'dermal' },
  { label: 'Ear', value: 'ear' },
  { label: 'Eye', value: 'eye' },
  { label: 'IM', value: 'intramuscular' },
  { label: 'IV', value: 'intravenous' },
  { label: 'Inhaled', value: 'inhaled' },
  { label: 'Nasal', value: 'nasal' },
  { label: 'Oral', value: 'oral' },
  { label: 'Rectal', value: 'rectal' },
  { label: 'S/C', value: 'subcutaneous' },
  { label: 'Sublingual', value: 'sublingual' },
  { label: 'Topical', value: 'topical' },
  { label: 'Vaginal', value: 'vaginal' },
];

export const MedicationForm = React.memo(
  ({ onCancel, onSubmit, drugSuggester, practitionerSuggester }) => (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: new Date(),
        qtyMorning: 0,
        qtyLunch: 0,
        qtyEvening: 0,
        qtyNight: 0,
      }}
      validationSchema={yup.object().shape({
        medicationId: foreignKey('Medication must be selected'),
        prescriberId: foreignKey('Prescriber must be selected'),
        prescription: yup.string().required(),
        route: yup
          .string()
          .oneOf(drugRouteOptions.map(x => x.value))
          .required(),
        date: yup.date().required(),
        endDate: yup.date(),
        note: yup.string(),
        quantity: yup
          .number()
          .integer()
          .positive(),
      })}
      render={({ submitForm }) => (
        <FormGrid>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field
              name="medicationId"
              label="Medication"
              component={AutocompleteField}
              suggester={drugSuggester}
              required
            />
          </div>
          <Field name="prescription" label="Prescription" component={TextField} required />
          <Field
            name="route"
            label="Route of administration"
            component={SelectField}
            options={drugRouteOptions}
            required
          />
          <Field name="date" label="Prescription date" component={DateField} required />
          <Field name="endDate" label="End date" component={DateField} />
          <Field
            name="prescriberId"
            label="Prescriber"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field name="note" label="Notes" component={TextField} style={{ gridColumn: '1/-1' }} />
          <FormGrid nested>
            <h3 style={{ gridColumn: '1/-1' }}>Quantity</h3>
            <Field name="qtyMorning" label="Morning" component={NumberField} />
            <Field name="qtyLunch" label="Lunch" component={NumberField} />
            <Field name="qtyEvening" label="Evening" component={NumberField} />
            <Field name="qtyNight" label="Night" component={NumberField} />
          </FormGrid>
          <Field name="indication" label="Indication" component={TextField} />
          <Field name="quantity" label="Discharge quantity" component={NumberField} />
          <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  ),
);
