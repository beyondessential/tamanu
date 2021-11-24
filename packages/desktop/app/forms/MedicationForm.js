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

const validationSchema = (readOnly) => {
  return !readOnly ? yup.object().shape({
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
  }) : yup.object().shape({
    discontinuingReason: yup.string(),
    discontinuingClinician: foreignKey('Clinician must be selected'),
  });
};

export const MedicationForm = React.memo(
  ({ onCancel, onSubmit, drugSuggester, practitionerSuggester, medication, shouldDiscontinue, onDiscontinue, readOnly }) => {
    const shouldShowDiscontinuationButton = readOnly && !medication?.discontinued;
    const shouldShowSubmitButton = !readOnly || shouldDiscontinue;
    
    console.log({ shouldShowSubmitButton })
    return (
      <Form
        onSubmit={onSubmit}
        initialValues={{
          note: medication?.note ?? '',
          route: medication?.route ?? '',
          prescription: medication?.prescription ?? '',
          date: medication?.createdAt ?? new Date(),
          qtyMorning: medication?.qtyMorning ?? 0,
          qtyLunch: medication?.qtyMorning ?? 0,
          qtyEvening: medication?.qtyEvening ?? 0,
          qtyNight: medication?.qtyNight ?? 0,
        }}
        validationSchema={validationSchema(readOnly)}
        render={({ submitForm }) => (
          <FormGrid>
            {console.log(medication)}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field
                name="medicationId"
                label="Medication"
                component={AutocompleteField}
                suggester={drugSuggester}
                disabled={readOnly}
                value={medication?.medication?.id}
                disabled={readOnly}
              />
            </div>
            <Field
              name="prescription"
              label="Prescription"
              component={TextField}
              required={!readOnly}
              disabled={readOnly}
            />
            <Field
              name="route"
              label="Route of administration"
              component={SelectField}
              options={drugRouteOptions}
              disabled={readOnly}
              required={!readOnly}
            />
            <Field name="date" label="Prescription date" component={DateField} required={!readOnly} disabled={readOnly} value={medication?.createdAt} />
            <Field name="endDate" label="End date" component={DateField} disabled={readOnly} value={medication?.endDate} />
            <Field
              name="prescriberId"
              label="Prescriber"
              component={AutocompleteField}
              suggester={practitionerSuggester}
              required={!readOnly}
              disabled={readOnly}
              value={medication?.prescriberId}
            />
            <Field name="note" label="Notes" component={TextField} style={{ gridColumn: '1/-1' }} disabled={readOnly} />
            <FormGrid nested>
              <h3 style={{ gridColumn: '1/-1' }}>Quantity</h3>
              <Field name="qtyMorning" label="Morning" component={NumberField} disabled={readOnly} />
              <Field name="qtyLunch" label="Lunch" component={NumberField} disabled={readOnly} />
              <Field name="qtyEvening" label="Evening" component={NumberField} disabled={readOnly} />
              <Field name="qtyNight" label="Night" component={NumberField} disabled={readOnly} />
            </FormGrid>
            <Field name="indication" label="Indication" component={TextField} disabled={readOnly} />
            <Field name="quantity" label="Discharge quantity" component={NumberField} disabled={readOnly} />
            {shouldShowDiscontinuationButton && (
              <ConfirmCancelRow confirmText="Discontinue" confirmColor="secondary" cancelText="Close" onConfirm={onDiscontinue} onCancel={onCancel} />
            )}
            <div>
              {shouldDiscontinue && (
                <>
                  <Field
                    name="discontinuingClinician"
                    label="Discontinuation clinician"
                    component={AutocompleteField}
                    suggester={practitionerSuggester}
                    value={medication?.discontinuingClinician}
                  />
                  <Field
                    name="discontinuingReason"
                    label="Reason for discontinuation"
                    component={TextField}
                  />
                </>
              )}
              {medication?.discontinued && (
                <p style={{ color: 'red' }}>
                  <span style={{ fontWeight: 'bold' }}>Discontinued</span><br />
                  Reason: {medication?.discontinuingReason}
                </p>
              )}
            </div>
            {shouldShowSubmitButton && <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />}
          </FormGrid>
        )}
      />
    );
  },
);
