import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import * as yup from 'yup';

import { ADMINISTRATION_FREQUENCIES, FORM_TYPES } from '@tamanu/constants';
import {
  Button,
  Form,
  FormGrid,
  OutlinedButton,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import { getDrugUnitLabel } from '@tamanu/shared/utils/medication';

import { useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { useTranslation } from '../../contexts/Translation';
import { foreignKey } from '../../utils/validation';
import { preventInvalidNumber } from '../../utils/utils';
import { AutocompleteField, CheckField, Field, NumberField } from '../Field';
import { FormModal } from '../FormModal';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { BodyText, SmallBodyText } from '../Typography';
import { Colors } from '../../constants';
import {
  DoseAmountField,
  DurationUnitField,
  DurationValueField,
  FrequencyField,
  MedicationAutocompleteField,
  OutlinedCheckField,
  RouteField,
  VariableDoseCheckField,
} from './PrescriptionFields';
import { prescriptionClinicalValidation } from './prescriptionValidation';
import { DispensingQuantityAutocalculator } from './DispensingQuantityAutocalculator';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const VariableDoseFieldWrapper = styled.div`
  grid-column: 1 / -1;
  width: 290px;
`;

const ButtonRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 0 -32px;
  padding: 20px 32px 0;
  border-top: 1px solid ${Colors.outline};
`;

const PharmacyNoteDescription = styled(SmallBodyText)`
  font-weight: 400;
`;

const validationSchema = yup.object().shape({
  // medicationId, doseAmount, frequency, route, durationValue, durationUnit — same clinical
  // invariants as prescribing (MedicationForm).
  ...prescriptionClinicalValidation,
  // The modify form clears numeric fields to null (variable dose clears the dose, 'Immediately'
  // clears the duration), so the shared rules are loosened to accept null here — `required`
  // still rejects null when the dose is not variable.
  doseAmount: prescriptionClinicalValidation.doseAmount.nullable(),
  durationValue: prescriptionClinicalValidation.durationValue.nullable(),
  isVariableDose: yup.boolean(),
  quantity: yup.number().integer().positive().nullable(),
  pharmacyNotes: yup.string().nullable(),
  modifiedReasonId: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  modifiedById: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
});

// Appends the standard "modified by pharmacy" note to the end of any existing pharmacy notes,
// without duplicating it if it is already present.
export const appendPharmacyNote = (existingNotes, note) => {
  const existing = existingNotes ?? '';
  if (!existing.trim()) return note;
  return existing.includes(note) ? existing : `${existing}\n${note}`;
};

/**
 * Modify the prescription details for a fill being dispensed. The values entered here are held by
 * the dispense workflow and recorded on the medication dispense when it is created — the original
 * prescription is never altered. Pre-fills from any modification already made in this workflow,
 * otherwise from the prescription.
 */
export const ModifyPrescriptionModal = ({
  open,
  prescription = null,
  modification = null,
  quantity = '',
  labelNotes = '',
  onClose,
  onConfirm,
}) => {
  const { currentUser } = useAuth();
  const { getSetting } = useSettings();
  const isDispensingQuantityAutocalculationEnabled = getSetting(
    'medications.dispensing.dispensingQuantityAutocalculation',
  );
  const { getTranslation, getEnumTranslation } = useTranslation();
  // Retains the dose amount when variable dose is toggled on (which clears the field), so
  // unticking it restores the previous value instead of leaving it empty.
  const retainedDoseAmount = useRef(null);

  const defaultPharmacyNote = getTranslation(
    'medication.modify.defaultPharmacyNote',
    'This prescription has been modified by pharmacy when dispensing. Please check for details if unsure.',
  );

  const drugSuggester = useSuggester('drug', {
    formatter: ({ name, id, ...rest }) => ({ ...rest, label: name, value: id }),
  });
  const practitionerSuggester = useSuggester('practitioner');
  const modificationReasonSuggester = useSuggester('medicationDispenseModifyReason');

  if (!prescription) return null;

  const source = modification ?? prescription;

  const onSubmit = async values => {
    const medication =
      values.medicationId === prescription.medicationId
        ? prescription.medication
        : await drugSuggester
            .fetchCurrentOption(values.medicationId)
            .then(option => ({ id: values.medicationId, name: option?.label ?? '' }));
    onConfirm({
      medicationId: values.medicationId,
      // Kept for display in the dispense workflow (table row, printed label) and for
      // re-populating the form on re-open — the server resolves units itself on dispense.
      medication,
      dosingUnit: values.dosingUnit,
      dispensingUnit: values.dispensingUnit,
      unitConversion: values.unitConversion,
      isVariableDose: values.isVariableDose ?? false,
      doseAmount: values.isVariableDose ? null : values.doseAmount || null,
      frequency: values.frequency,
      route: values.route,
      durationValue: values.durationValue || null,
      durationUnit: values.durationValue ? values.durationUnit || null : null,
      labelNotes: values.labelNotes ?? '',
      quantity: values.quantity || null,
      pharmacyNotes: values.pharmacyNotes || null,
      modifiedReasonId: values.modifiedReasonId,
      modifiedById: values.modifiedById,
    });
    onClose();
  };

  return (
    <StyledFormModal
      open={open}
      title={<TranslatedText stringId="medication.modify.title" fallback="Modify prescription" />}
      onClose={onClose}
      isClosable
    >
      <Form
        onSubmit={onSubmit}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={validationSchema}
        initialValues={{
          medicationId: source.medicationId ?? prescription.medicationId,
          // Units follow the selected drug (see the medication field's onChange); they are
          // display-only here — the server re-resolves them from the dispensed drug's
          // reference data when the fill is created.
          dosingUnit: source.dosingUnit ?? prescription.dosingUnit ?? '',
          dispensingUnit: source.dispensingUnit ?? prescription.dispensingUnit ?? '',
          unitConversion: source.unitConversion ?? prescription.unitConversion ?? 1,
          isVariableDose: source.isVariableDose ?? false,
          doseAmount: source.doseAmount ?? '',
          frequency: source.frequency ?? '',
          route: source.route ?? '',
          durationValue: source.durationValue ?? '',
          durationUnit: source.durationUnit ?? '',
          labelNotes: labelNotes ?? '',
          quantity: quantity ?? '',
          pharmacyNotes: appendPharmacyNote(
            modification ? modification.pharmacyNotes : prescription.pharmacyNotes,
            defaultPharmacyNote,
          ),
          // Pharmacy notes for a modified fill always display on the MAR (auto-selected, read-only)
          displayPharmacyNotesInMar: true,
          modifiedReasonId: modification?.modifiedReasonId ?? '',
          modifiedById: modification?.modifiedById ?? currentUser?.id ?? '',
        }}
        render={({ values, setValues, setFieldError }) => (
          <FormGrid>
            <DispensingQuantityAutocalculator
              enabled={isDispensingQuantityAutocalculationEnabled}
              isOngoing={Boolean(prescription.isOngoing)}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <MedicationAutocompleteField
                suggester={drugSuggester}
                onChange={e => {
                  const referenceDrug = e.target.referenceDrug;
                  setValues({
                    ...values,
                    medicationId: e.target.value,
                    dosingUnit: referenceDrug?.dosingUnit ?? '',
                    dispensingUnit: referenceDrug?.dispensingUnit ?? '',
                    unitConversion: referenceDrug?.unitConversion ?? 1,
                  });
                }}
                data-testid="modify-prescription-medication"
              />
            </div>
            <FormSeparatorLine />
            <VariableDoseFieldWrapper>
              <VariableDoseCheckField
                component={OutlinedCheckField}
                $isChecked={values.isVariableDose}
                onChange={(_, value) => {
                  if (value) {
                    retainedDoseAmount.current = values.doseAmount;
                    setValues({ ...values, doseAmount: '' });
                    setFieldError('doseAmount', null);
                  } else if (retainedDoseAmount.current) {
                    setValues({ ...values, doseAmount: retainedDoseAmount.current });
                  }
                }}
                data-testid="modify-prescription-variable-dose"
              />
            </VariableDoseFieldWrapper>
            <DoseAmountField
              label={<TranslatedText stringId="medication.dose.label" fallback="Dose" />}
              required={!values.isVariableDose}
              disabled={values.isVariableDose}
              unit={
                values.dosingUnit
                  ? getDrugUnitLabel(values.dosingUnit, values.doseAmount, getEnumTranslation)
                  : undefined
              }
              data-testid="modify-prescription-dose"
            />
            <FrequencyField
              onChange={e => {
                if (e.target.value === ADMINISTRATION_FREQUENCIES.IMMEDIATELY) {
                  setValues({ ...values, durationValue: '', durationUnit: '' });
                }
              }}
              data-testid="modify-prescription-frequency"
            />
            <RouteField data-testid="modify-prescription-route" />
            <FormGrid nested>
              <DurationValueField
                disabled={values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY}
                data-testid="modify-prescription-duration-value"
              />
              <DurationUnitField
                disabled={values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY}
                data-testid="modify-prescription-duration-unit"
              />
            </FormGrid>
            <Field
              name="labelNotes"
              label={
                <TranslatedText stringId="medication.labelNotes.label" fallback="Label notes" />
              }
              component={TextField}
              style={{ gridColumn: '1 / -1' }}
              data-testid="modify-prescription-label-notes"
            />
            <FormSeparatorLine />
            <Field
              name="quantity"
              label={
                <TranslatedText
                  stringId="medication.dispensingQuantity.label"
                  fallback="Dispensing quantity"
                />
              }
              component={NumberField}
              min={0}
              onInput={preventInvalidNumber}
              unit={
                values.dispensingUnit
                  ? getDrugUnitLabel(values.dispensingUnit, values.quantity, getEnumTranslation)
                  : undefined
              }
              data-testid="modify-prescription-quantity"
            />
            <div />
            <Field
              name="pharmacyNotes"
              label={
                <span>
                  <TranslatedText
                    stringId="medication.details.pharmacyNotes"
                    fallback="Pharmacy notes"
                  />{' '}
                  <PharmacyNoteDescription as="i" color={Colors.softText}>
                    <TranslatedText
                      stringId="medication.pharmacyNotes.notificationHint"
                      fallback="This note will be sent to the original prescriber as a notification"
                    />
                  </PharmacyNoteDescription>
                </span>
              }
              component={TextField}
              multiline
              rows={2}
              style={{ gridColumn: '1 / -1' }}
              data-testid="modify-prescription-pharmacy-notes"
            />
            <div style={{ gridColumn: '1 / -1', marginTop: '5px' }}>
              <Field
                name="displayPharmacyNotesInMar"
                label={
                  <BodyText>
                    <TranslatedText
                      stringId="medication.details.displayInMarInstructions"
                      fallback="Display pharmacy notes on MAR"
                    />
                  </BodyText>
                }
                component={CheckField}
                disabled
                data-testid="modify-prescription-display-in-mar"
              />
            </div>
            <FormSeparatorLine />
            <Field
              name="modifiedReasonId"
              label={
                <TranslatedText
                  stringId="medication.modificationReason.label"
                  fallback="Reason for modification"
                />
              }
              component={AutocompleteField}
              suggester={modificationReasonSuggester}
              required
              data-testid="modify-prescription-reason"
            />
            <Field
              name="modifiedById"
              label={
                <TranslatedText stringId="medication.modifiedBy.label" fallback="Modified by" />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              required
              data-testid="modify-prescription-modified-by"
            />
            <ButtonRow>
              <OutlinedButton onClick={onClose} data-testid="modify-prescription-cancel">
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </OutlinedButton>
              <Button type="submit" data-testid="modify-prescription-confirm">
                <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
              </Button>
            </ButtonRow>
          </FormGrid>
        )}
      />
    </StyledFormModal>
  );
};

ModifyPrescriptionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  // The (original) prescription for the fill being dispensed — never altered.
  prescription: PropTypes.object,
  // A modification already made in this workflow, used to re-populate the form on re-open.
  modification: PropTypes.object,
  // Current dispensing quantity and label text from the workflow row.
  quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  labelNotes: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
