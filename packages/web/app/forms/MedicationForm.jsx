import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box, Divider } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import {
  DRUG_UNIT_VALUES,
  DRUG_UNIT_LABELS,
  DRUG_ROUTE_LABELS,
  DRUG_ROUTE_VALUES,
  MEDICATION_DURATION_UNITS_LABELS,
} from '@tamanu/constants';
import { foreignKey } from '../utils/validation';
import { PrintPrescriptionModal } from '../components/PatientPrinting';
import {
  AutocompleteField,
  BodyText,
  CheckField,
  DateField,
  DateTimeField,
  Field,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  NumberField,
  SelectField,
  TextField,
  TranslatedSelectField,
} from '../components';
import { Colors, FORM_TYPES, MAX_AGE_TO_RECORD_WEIGHT } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { getAgeDurationFromDate } from '@tamanu/utils/date';
import { useQuery } from '@tanstack/react-query';
import { useApi, useSuggester } from '../api';
import { useSelector } from 'react-redux';
import { getReferenceDataStringId } from '../components/Translation/index.js';
import { FrequencySearchField } from '../components/Medication/FrequencySearchInput.jsx';
import { useAuth } from '../contexts/Auth.js';

const validationSchema = yup.object().shape({
  medicationId: foreignKey().translatedLabel(
    <TranslatedText stringId="medication.medication.label" fallback="Medication" />,
  ),
  isOngoing: yup.boolean().optional(),
  isPrn: yup.boolean().optional(),
  doseAmount: yup
    .number()
    .positive()
    .required()
    .translatedLabel(
      <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />,
    ),
  units: foreignKey()
    .oneOf(DRUG_UNIT_VALUES)
    .translatedLabel(<TranslatedText stringId="medication.units.label" fallback="Units" />),
  frequency: foreignKey().translatedLabel(
    <TranslatedText stringId="medication.frequency.label" fallback="Frequency" />,
  ),
  route: foreignKey()
    .oneOf(DRUG_ROUTE_VALUES)
    .translatedLabel(<TranslatedText stringId="medication.route.label" fallback="Route" />),
  date: yup
    .date()
    .required()
    .translatedLabel(
      <TranslatedText stringId="medication.date.label" fallback="Prescription date" />,
    ),
  startDate: yup
    .date()
    .required()
    .translatedLabel(
      <TranslatedText stringId="medication.startDatetime.label" fallback="Start date & time" />,
    ),
  prescriberId: foreignKey().translatedLabel(
    <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />,
  ),
  quantity: yup.number().integer(),
  patientWeight: yup
    .number()
    .positive()
    .translatedLabel(
      <TranslatedText stringId="medication.patientWeight.label" fallback="Patient weight" />,
    ),
});

const CheckboxGroup = styled.div`
  .MuiTypography-body1 {
    font-size: 14px;
  }
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid ${Colors.outline};
`;

const ButtonRow = styled.div`
  display: flex;
  grid-column: 1 / -1;
  justify-content: space-between;
  height: 40px;
`;

export const MedicationForm = React.memo(({ encounterId, onCancel, onSaved }) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const { getTranslation } = useTranslation();
  const weightUnit = getTranslation('general.localisedField.weightUnit.label', 'kg');

  const patient = useSelector(state => state.patient);
  const age = getAgeDurationFromDate(patient.dateOfBirth).years;
  const showPatientWeight = age < MAX_AGE_TO_RECORD_WEIGHT;

  const [submittedMedication, setSubmittedMedication] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState();
  const [awaitingPrint, setAwaitingPrint] = useState(false);
  const [patientWeight, setPatientWeight] = useState('');

  const practitionerSuggester = useSuggester('practitioner');
  const drugSuggester = useSuggester('drug', {
    formatter: ({ name, id, ...rest }) => ({ ...rest, label: name, value: id }),
  });

  const { data: allergies, isLoading: isLoadingAllergies } = useQuery(
    [`allergies`, patient?.id],
    () => api.get(`patient/${patient?.id}/allergies`),
    { enabled: !!patient?.id },
  );
  const allergiesList = allergies?.data
    ?.map(allergyDetail =>
      getTranslation(
        getReferenceDataStringId(allergyDetail?.allergy.id, allergyDetail?.allergy.type),
        allergyDetail?.allergy.name,
      ),
    )
    .join(', ');

  // Transition to print page as soon as we have the generated id
  useEffect(() => {
    (async () => {
      if (awaitingPrint && submittedMedication) {
        setPrintModalOpen(true);
      }
    })();
  }, [awaitingPrint, submittedMedication]);

  const validateDecimalPlaces = e => {
    const value = e.target.value;
    if (/^[−-]/.test(value)) {
      e.target.value = '';
      return;
    }
    if (value.includes('.')) {
      const decimalPlaces = value.split('.')[1].length;
      if (decimalPlaces > 1) {
        console.log(e.target.value, parseFloat(value).toFixed(1));
        e.target.value = parseFloat(value).toFixed(1);
      }
    }
  };

  const preventNegative = value => {
    if (!value.target.validity.valid) {
      value.target.value = 0;
    }
  };

  const onSubmit = async data => {
    const medicationSubmission = await api.post('medication', {
      ...data,
      encounterId,
    });
    // The return from the post doesn't include the joined tables like medication and prescriber
    const newMedication = await api.get(`medication/${medicationSubmission.id}`);

    setSubmittedMedication(newMedication);
  };

  return (
    <>
      <Form
        onSubmit={onSubmit}
        onSuccess={() => {
          if (!awaitingPrint) {
            onSaved();
          }
        }}
        initialValues={{
          date: new Date(),
          prescriberId: currentUser.id,
        }}
        formType={FORM_TYPES.CREATE_FORM}
        validationSchema={validationSchema}
        render={({ submitForm, setValues, values }) => (
          <FormGrid>
            <div style={{ gridColumn: '1 / -1' }}>
              <TranslatedText stringId="medication.allergies.title" fallback="Allergies" />:{' '}
              <span style={{ fontWeight: 500 }}>
                {!isLoadingAllergies &&
                  (allergiesList || (
                    <TranslatedText
                      stringId="medication.allergies.noRecord"
                      fallback="None recorded"
                    />
                  ))}
              </span>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field
                name="medicationId"
                label={
                  <TranslatedText stringId="medication.medication.label" fallback="Medication" />
                }
                component={AutocompleteField}
                suggester={drugSuggester}
                required
                onChange={e => {
                  const referenceDrug = e.target.referenceDrug;
                  setValues({
                    ...values,
                    route: referenceDrug?.route || '',
                    units: referenceDrug?.units || '',
                    notes: referenceDrug?.notes || '',
                  });
                }}
              />
            </div>
            <CheckboxGroup>
              <Field
                name="isOngoing"
                label={
                  <TranslatedText
                    stringId="medication.isOngoing.label"
                    fallback="Ongoing Medication"
                  />
                }
                component={CheckField}
              />
              <Field
                name="isPrn"
                label={
                  <TranslatedText
                    stringId="medication.isPrn.label"
                    fallback="PRN Medication"
                  />
                }
                component={CheckField}
              />
            </CheckboxGroup>
            <Field
              name="doseAmount"
              label={
                <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />
              }
              component={NumberField}
              min={0}
              step="any"
              onInput={validateDecimalPlaces}
              required
            />
            <Field
              name="units"
              label={<TranslatedText stringId="medication.units.label" fallback="Units" />}
              component={TranslatedSelectField}
              enumValues={DRUG_UNIT_LABELS}
              required
            />
            <Field name="frequency" component={FrequencySearchField} required />
            <Field
              name="route"
              label={<TranslatedText stringId="medication.route.label" fallback="Route" />}
              component={TranslatedSelectField}
              enumValues={DRUG_ROUTE_LABELS}
              required
            />
            <Field
              name="date"
              label={
                <TranslatedText stringId="medication.date.label" fallback="Prescription date" />
              }
              saveDateAsString
              component={DateField}
              required
            />
            <Field
              name="startDate"
              label={
                <TranslatedText
                  stringId="medication.startDatetime.label"
                  fallback="Start date & time"
                />
              }
              saveDateAsString
              component={DateTimeField}
              required
            />
            <FormGrid nested>
              <Field
                name="durationValue"
                label={<TranslatedText stringId="medication.duration.label" fallback="Duration" />}
                component={NumberField}
                min={0}
                onInput={preventNegative}
              />
              <Field
                name="durationUnit"
                label={<Box sx={{ opacity: 0 }}>.</Box>}
                component={SelectField}
                options={Object.entries(MEDICATION_DURATION_UNITS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </FormGrid>
            <div />
            <Field
              name="prescriberId"
              label={
                <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              required
            />
            <Field
              name="indication"
              label={
                <TranslatedText stringId="medication.indication.label" fallback="Indication" />
              }
              component={TextField}
            />
            <div style={{ gridColumn: '1/-1' }}>
              <Field
                name="isPhoneOrder"
                label={
                  <BodyText>
                    <TranslatedText
                      stringId="medication.isPhoneOrder.label"
                      fallback="Phone Order"
                    />
                  </BodyText>
                }
                component={CheckField}
              />
            </div>
            <Field
              name="notes"
              label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
              component={TextField}
              style={{ gridColumn: '1/-1' }}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Divider />
            </div>
            <Field
              name="quantity"
              label={
                <TranslatedText
                  stringId="medication.dischargeQuantity.label"
                  fallback="Discharge quantity"
                />
              }
              min={0}
              component={NumberField}
              onInput={preventNegative}
            />
            {showPatientWeight && (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Divider />
                </div>
                <Field
                  name="patientWeight"
                  label={
                    <TranslatedText
                      stringId="medication.patientWeight.label"
                      fallback="Patient weight if printing (:unit)"
                      replacements={{ unit: `(${weightUnit})` }}
                    />
                  }
                  onChange={e => setPatientWeight(e.target.value)}
                  component={TextField}
                  placeholder={getTranslation('medication.patientWeight.placeholder', 'e.g 2.4')}
                  type="number"
                />
              </>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <Divider />
            </div>
            <ButtonRow>
              <FormSubmitButton
                color="primary"
                onClick={data => {
                  setAwaitingPrint(true);
                  submitForm(data);
                }}
                variant="outlined"
                startIcon={<PrintIcon />}
              >
                <TranslatedText
                  stringId="medication.action.finaliseAndPrint"
                  fallback="Finalise & Print"
                />
              </FormSubmitButton>
              <Box display="flex" sx={{ gap: '16px' }}>
                <FormCancelButton onClick={onCancel}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </FormCancelButton>
                <FormSubmitButton
                  color="primary"
                  onClick={data => {
                    setAwaitingPrint(false);
                    submitForm(data);
                  }}
                >
                  <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
                </FormSubmitButton>
              </Box>
            </ButtonRow>
          </FormGrid>
        )}
      />
      {submittedMedication && (
        <PrintPrescriptionModal
          medication={submittedMedication}
          patientWeight={showPatientWeight ? patientWeight : undefined}
          open={printModalOpen}
          onClose={() => {
            if (awaitingPrint) {
              onSaved();
            }
            setAwaitingPrint(false);
            setPrintModalOpen(false);
          }}
        />
      )}
    </>
  );
});
