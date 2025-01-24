import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box, Divider } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import { DOSE_UNITS, DRUG_ROUTE_LABELS, DRUG_ROUTE_VALUES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { foreignKey } from '../utils/validation';
import { PrintPrescriptionModal } from '../components/PatientPrinting';
import {
  AutocompleteField,
  BodyText,
  Button,
  CheckField,
  DateField,
  DateTimeField,
  Field,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  getDateDisplay,
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
import { useApi } from '../api';
import { useSelector } from 'react-redux';
import { getReferenceDataStringId } from '../components/Translation/index.js';
import { FrequencySearchField } from '../components/Medication/FrequencySearchInput.jsx';
import { DURATION_UNITS_LABELS } from '@tamanu/constants';

const validationSchema = readOnly =>
  !readOnly
    ? yup.object().shape({
        medicationId: foreignKey().translatedLabel(
          <TranslatedText stringId="medication.medication.label" fallback="Medication" />,
        ),
        isOngoingMedication: yup.boolean(),
        isPRNMedication: yup.boolean(),
        doseAmount: yup
          .number()
          .required()
          .translatedLabel(
            <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />,
          ),
        units: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="medication.units.label" fallback="Units" />),
        frequency: yup.string().required().translatedLabel(
          <TranslatedText stringId="medication.frequency.label" fallback="Frequency" />,
        ),
        route: yup
          .string()
          .oneOf(DRUG_ROUTE_VALUES)
          .required()
          .translatedLabel(<TranslatedText stringId="medication.route.label" fallback="Route" />),
        prescriberId: foreignKey().translatedLabel(
          <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />,
        ),
        date: yup
          .date()
          .required()
          .translatedLabel(<TranslatedText stringId="general.date.label" fallback="Date" />),
        startDate: yup.date(),
        durationValue: yup.number(),
        durationUnit: yup.string(),
        indication: yup.string(),
        isPhoneOrder: yup.boolean(),
        note: yup.string(),
        quantity: yup.number().integer(),
        patientWeight: yup.number().positive().translatedLabel(
          <TranslatedText stringId="medication.patientWeight.label" fallback="Patient weight" />,
        ),
      })
    : yup.object().shape({
        discontinuingReason: yup.string(),
        discontinuingClinicianId: foreignKey().translatedLabel(
          <TranslatedText stringId="general.clinician.label" fallback="Clinician" />,
        ),
      });

const DiscontinuePrintButtonRow = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-column-gap: 0.7rem;
  grid-template-columns: 8rem auto 8rem 8rem;
  grid-column: -1 / 1;
`;

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

const DiscontinuedLabel = ({ medication }) => {
  const { discontinuedDate, discontinuingClinician, discontinuingReason } = medication;
  return (
    <Box color="error.main" ml={2}>
      <strong>
        <TranslatedText stringId="medication.detail.discontinued.title" fallback="Discontinued" />
      </strong>
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.discontinuedAt"
        fallback="Discontinued at: :date"
        replacements={{ date: getDateDisplay(discontinuedDate) }}
      />
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.discontinuedBy"
        fallback="by: :clinician"
        replacements={{ clinician: discontinuingClinician?.displayName }}
      />
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.reason"
        fallback="Reason: :reason"
        replacements={{ reason: discontinuingReason }}
      />
      <br />
    </Box>
  );
};

export const MedicationForm = React.memo(
  ({
    onCancel,
    onSaved,
    onSubmit,
    drugSuggester,
    practitionerSuggester,
    medication,
    submittedMedication,
    shouldDiscontinue,
    onDiscontinue,
    readOnly,
  }) => {
    const api = useApi();
    const { getTranslation } = useTranslation();
    const weightUnit = getTranslation('general.localisedField.weightUnit.label', 'kg');

    const patient = useSelector(state => state.patient);
    const age = getAgeDurationFromDate(patient.dateOfBirth).years;
    const showPatientWeight = age < MAX_AGE_TO_RECORD_WEIGHT;

    const shouldShowDiscontinuationButton = readOnly && !medication?.discontinued;
    const shouldShowSubmitButton = !readOnly || shouldDiscontinue;

    const [printModalOpen, setPrintModalOpen] = useState();
    const [awaitingPrint, setAwaitingPrint] = useState(false);
    const [patientWeight, setPatientWeight] = useState('');

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

    const preventNegative = value => {
      if (!value.target.validity.valid) {
        value.target.value = 0;
      }
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
            medicationId: medication?.medication?.id,
            isOngoingMedication: medication?.isOngoingMedication,
            isPRNMedication: medication?.isPRNMedication,
            doseAmount: medication?.doseAmount,
            units: medication?.units,
            frequency: medication?.frequency,
            startDate: medication?.startDate,
            durationValue: medication?.durationValue,
            durationUnit: medication?.durationUnit,
            isPhoneOrder: medication?.isPhoneOrder,
            prescriberId: medication?.prescriberId,
            note: medication?.note ?? '',
            route: medication?.route ?? '',
            prescription: medication?.prescription ?? '',
            date: medication?.date ?? getCurrentDateTimeString(),
            quantity: medication?.quantity ?? 0,
            indication: medication?.indication ?? '',
          }}
          formType={!readOnly ? (medication ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM) : null}
          validationSchema={validationSchema(readOnly)}
          render={({ submitForm }) => (
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
                  disabled={readOnly}
                  required={!readOnly}
                />
              </div>
              <CheckboxGroup>
                <Field
                  name="isOngoingMedication"
                  label={
                    <TranslatedText
                      stringId="medication.isOngoingMedication.label"
                      fallback="Ongoing Medication"
                    />
                  }
                  component={CheckField}
                  disabled={readOnly}
                />
                <Field
                  name="isPRNMedication"
                  label={
                    <TranslatedText
                      stringId="medication.isPRNMedication.label"
                      fallback="PRN Medication"
                    />
                  }
                  component={CheckField}
                  disabled={readOnly}
                />
              </CheckboxGroup>
              <Field
                name="doseAmount"
                label={
                  <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />
                }
                component={NumberField}
                required={!readOnly}
                disabled={readOnly}
                min={0}
                step="any"
                onInput={preventNegative}
              />
              <Field
                name="units"
                label={<TranslatedText stringId="medication.units.label" fallback="Units" />}
                component={SelectField}
                options={DOSE_UNITS.map(unit => ({ value: unit, label: unit }))}
                disabled={readOnly}
              />
              <Field
                name="frequency"
                component={FrequencySearchField}
                disabled={readOnly}
                required={!readOnly}
              />
              <Field
                name="route"
                label={<TranslatedText stringId="medication.route.label" fallback="Route" />}
                component={TranslatedSelectField}
                enumValues={DRUG_ROUTE_LABELS}
                disabled={readOnly}
                required={!readOnly}
              />
              <Field
                name="date"
                label={
                  <TranslatedText stringId="medication.date.label" fallback="Prescription date" />
                }
                saveDateAsString
                component={DateField}
                required={!readOnly}
                disabled={readOnly}
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
                disabled={readOnly}
              />
              <FormGrid>
                <Field
                  name="durationValue"
                  label={
                    <TranslatedText stringId="medication.duration.label" fallback="Duration" />
                  }
                  component={NumberField}
                  required={!readOnly}
                  disabled={readOnly}
                  min={0}
                  onInput={preventNegative}
                />
                <Field
                  name="durationUnit"
                  label={<Box sx={{ opacity: 0 }}>.</Box>}
                  component={SelectField}
                  options={Object.entries(DURATION_UNITS_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  disabled={readOnly}
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
                required={!readOnly}
                disabled={readOnly}
              />
              <Field
                name="indication"
                label={
                  <TranslatedText stringId="medication.indication.label" fallback="Indication" />
                }
                component={TextField}
                disabled={readOnly}
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
                  disabled={readOnly}
                />
              </div>
              <Field
                name="note"
                label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
                component={TextField}
                style={{ gridColumn: '1/-1' }}
                disabled={readOnly}
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
                disabled={readOnly}
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
                        fallback="Patient weight :unit"
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
              {shouldShowDiscontinuationButton && (
                <>
                  <div style={{ gridColumn: '1 / -1', margin: '14px -40px 0 -40px' }}>
                    <Divider />
                  </div>
                  <DiscontinuePrintButtonRow>
                    <Button variant="outlined" color="primary" onClick={onDiscontinue}>
                      <TranslatedText
                        stringId="medication.action.discontinue"
                        fallback="Discontinue"
                      />
                    </Button>
                    <div />
                    {!shouldDiscontinue && (
                      <>
                        <Button variant="outlined" color="primary" onClick={onCancel}>
                          <TranslatedText stringId="general.action.close" fallback="Close" />
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setPrintModalOpen(true)}
                        >
                          <TranslatedText stringId="general.action.print" fallback="Print" />
                        </Button>
                      </>
                    )}
                  </DiscontinuePrintButtonRow>
                </>
              )}
              <div>
                {shouldDiscontinue && (
                  <>
                    <Field
                      name="discontinuingClinicianId"
                      label={
                        <TranslatedText
                          stringId="medication.discontinuedBy.label"
                          fallback="Discontinued by"
                        />
                      }
                      component={AutocompleteField}
                      suggester={practitionerSuggester}
                      value={medication?.discontinuingClinicianId}
                    />
                    <Field
                      name="discontinuingReason"
                      label={
                        <TranslatedText
                          stringId="medication.discontinuedReason.label"
                          fallback="Discontinued reason"
                        />
                      }
                      component={TextField}
                    />
                  </>
                )}
                {medication?.discontinuedDate && <DiscontinuedLabel medication={medication} />}
              </div>
              {shouldShowSubmitButton && (
                <>
                  <div style={{ gridColumn: '1 / -1', margin: '14px -40px 0 -40px' }}>
                    <Divider />
                  </div>
                  <ButtonRow>
                    {!shouldDiscontinue ? (
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
                    ) : (
                      <div />
                    )}
                    <Box display="flex" sx={{ gap: '16px' }}>
                      <FormCancelButton onClick={onCancel}>
                        <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                      </FormCancelButton>
                      {shouldDiscontinue && (
                        <FormSubmitButton
                          color="primary"
                          onClick={data => {
                            setAwaitingPrint(false);
                            submitForm(data);
                          }}
                        >
                          <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
                        </FormSubmitButton>
                      )}
                    </Box>
                  </ButtonRow>
                </>
              )}
            </FormGrid>
          )}
        />
        {(submittedMedication || medication) && (
          <PrintPrescriptionModal
            medication={submittedMedication || medication}
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
  },
);
