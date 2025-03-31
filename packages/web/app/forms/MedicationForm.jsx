import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box } from '@material-ui/core';
import { DRUG_ROUTE_LABELS, DRUG_ROUTE_VALUES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { foreignKey } from '../utils/validation';
import { PrintPrescriptionModal } from '../components/PatientPrinting';
import { FormSubmitDropdownButton } from '../components/DropdownButton';
import {
  AutocompleteField,
  Button,
  ButtonRow,
  DateField,
  Field,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  getDateDisplay,
  NumberField,
  TextField,
  TranslatedSelectField,
} from '../components';
import { FORM_TYPES, MAX_AGE_TO_RECORD_WEIGHT } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { getAgeDurationFromDate } from '@tamanu/utils/date';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../api';
import { useSelector } from 'react-redux';
import { getReferenceDataStringId } from '../components/Translation/index.js';

const validationSchema = readOnly =>
  !readOnly
    ? yup.object().shape({
        medicationId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="medication.medication.label"
            fallback="Medication"
            data-test-id='translatedtext-5jq3' />,
        ),
        prescriberId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="medication.prescriber.label"
            fallback="Prescriber"
            data-test-id='translatedtext-89r6' />,
        ),
        prescription: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="medication.instructions.label"
              fallback="Instructions"
              data-test-id='translatedtext-yj5l' />,
          ),
        route: yup
          .string()
          .oneOf(DRUG_ROUTE_VALUES)
          .required()
          .translatedLabel(<TranslatedText
          stringId="medication.route.label"
          fallback="Route"
          data-test-id='translatedtext-1a79' />),
        date: yup
          .date()
          .required()
          .translatedLabel(<TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-test-id='translatedtext-ygst' />),
        endDate: yup.date(),
        note: yup.string(),
        quantity: yup.number().integer(),
      })
    : yup.object().shape({
        discontinuingReason: yup.string(),
        discontinuingClinicianId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="general.clinician.label"
            fallback="Clinician"
            data-test-id='translatedtext-mmaw' />,
        ),
      });

const DiscontinuePrintButtonRow = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-column-gap: 0.7rem;
  grid-template-columns: 8rem auto 8rem 8rem;
  grid-column: -1 / 1;
`;

const DiscontinuedLabel = ({ medication }) => {
  const { discontinuedDate, discontinuingClinician, discontinuingReason } = medication;
  return (
    <Box color="error.main" ml={2}>
      <strong>
        <TranslatedText
          stringId="medication.detail.discontinued.title"
          fallback="Discontinued"
          data-test-id='translatedtext-4v6m' />
      </strong>
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.discontinuedAt"
        fallback="Discontinued at: :date"
        replacements={{ date: getDateDisplay(discontinuedDate) }}
        data-test-id='translatedtext-3r3b' />
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.discontinuedBy"
        fallback="by: :clinician"
        replacements={{ clinician: discontinuingClinician?.displayName }}
        data-test-id='translatedtext-jp8k' />
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.reason"
        fallback="Reason: :reason"
        replacements={{ reason: discontinuingReason }}
        data-test-id='translatedtext-jbfw' />
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
            prescriberId: medication?.prescriberId,
            note: medication?.note ?? '',
            route: medication?.route ?? '',
            prescription: medication?.prescription ?? '',
            date: medication?.date ?? getCurrentDateTimeString(),
            qtyMorning: medication?.qtyMorning ?? 0,
            qtyLunch: medication?.qtyLunch ?? 0,
            qtyEvening: medication?.qtyEvening ?? 0,
            qtyNight: medication?.qtyNight ?? 0,
            quantity: medication?.quantity ?? 0,
            indication: medication?.indication ?? '',
          }}
          formType={!readOnly ? (medication ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM) : null}
          validationSchema={validationSchema(readOnly)}
          render={({ submitForm }) => (
            <FormGrid>
              <div style={{ gridColumn: '1 / -1' }}>
                <TranslatedText
                  stringId="medication.allergies.title"
                  fallback="Allergies"
                  data-test-id='translatedtext-l51q' />:{' '}
                <span style={{ fontWeight: 500 }}>
                  {!isLoadingAllergies &&
                    (allergiesList || (
                      <TranslatedText
                        stringId="medication.allergies.noRecord"
                        fallback="None recorded"
                        data-test-id='translatedtext-ga21' />
                    ))}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field
                  name="medicationId"
                  label={
                    <TranslatedText
                      stringId="medication.medication.label"
                      fallback="Medication"
                      data-test-id='translatedtext-bwp9' />
                  }
                  component={AutocompleteField}
                  suggester={drugSuggester}
                  disabled={readOnly}
                  required={!readOnly}
                  data-test-id='field-nrga' />
              </div>
              <Field
                name="prescription"
                label={
                  <TranslatedText
                    stringId="medication.instructions.label"
                    fallback="Instructions"
                    data-test-id='translatedtext-niuo' />
                }
                component={TextField}
                required={!readOnly}
                disabled={readOnly}
                data-test-id='field-25qi' />
              <Field
                name="route"
                label={
                  <TranslatedText
                    stringId="medication.route.label"
                    fallback="Route of admission"
                    data-test-id='translatedtext-6k5b' />
                }
                component={TranslatedSelectField}
                enumValues={DRUG_ROUTE_LABELS}
                disabled={readOnly}
                required={!readOnly}
                data-test-id='field-qs6r' />
              <Field
                name="date"
                label={
                  <TranslatedText
                    stringId="medication.date.label"
                    fallback="Prescription date"
                    data-test-id='translatedtext-xrrt' />
                }
                saveDateAsString
                component={DateField}
                required={!readOnly}
                disabled={readOnly}
                data-test-id='field-qgnk' />
              <Field
                name="endDate"
                label={<TranslatedText
                  stringId="medication.endDate.label"
                  fallback="End date"
                  data-test-id='translatedtext-kdcg' />}
                saveDateAsString
                component={DateField}
                disabled={readOnly}
                value={medication?.endDate}
                data-test-id='field-hvno' />
              <Field
                name="prescriberId"
                label={
                  <TranslatedText
                    stringId="medication.prescriber.label"
                    fallback="Prescriber"
                    data-test-id='translatedtext-f47b' />
                }
                component={AutocompleteField}
                suggester={practitionerSuggester}
                required={!readOnly}
                disabled={readOnly}
                data-test-id='field-o2rm' />
              {showPatientWeight && (
                <Field
                  name="patientWeight"
                  label={
                    <TranslatedText
                      stringId="medication.patientWeight.label"
                      fallback="Patient weight :unit"
                      replacements={{ unit: `(${weightUnit})` }}
                      data-test-id='translatedtext-5vni' />
                  }
                  onChange={e => setPatientWeight(e.target.value)}
                  component={TextField}
                  placeholder={getTranslation('medication.patientWeight.placeholder', 'e.g 2.4')}
                  type="number"
                  data-test-id='field-6ugb' />
              )}
              <Field
                name="note"
                label={<TranslatedText
                  stringId="general.notes.label"
                  fallback="Notes"
                  data-test-id='translatedtext-q6s9' />}
                component={TextField}
                style={{ gridColumn: '1/-1' }}
                disabled={readOnly}
                data-test-id='field-5jz7' />
              <FormGrid nested>
                <h3 style={{ gridColumn: '1/-1' }} data-test-id='h3-xmvm'>Quantity</h3>
                <Field
                  name="qtyMorning"
                  label={
                    <TranslatedText
                      stringId="medication.quantityMorning.label"
                      fallback="Morning"
                      data-test-id='translatedtext-cbzb' />
                  }
                  min={0}
                  component={NumberField}
                  onInput={preventNegative}
                  disabled={readOnly}
                  data-test-id='field-a4h2' />
                <Field
                  name="qtyLunch"
                  min={0}
                  label={
                    <TranslatedText
                      stringId="medication.quantityLunch.label"
                      fallback="Lunch"
                      data-test-id='translatedtext-t04k' />
                  }
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                  data-test-id='field-f6ju' />
                <Field
                  name="qtyEvening"
                  label={
                    <TranslatedText
                      stringId="medication.quantityEvening.label"
                      fallback="Evening"
                      data-test-id='translatedtext-cthw' />
                  }
                  min={0}
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                  data-test-id='field-uj43' />
                <Field
                  name="qtyNight"
                  label={
                    <TranslatedText
                      stringId="medication.quantityNight.label"
                      fallback="Night"
                      data-test-id='translatedtext-iool' />
                  }
                  min={0}
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                  data-test-id='field-5zoz' />
              </FormGrid>
              <Field
                name="indication"
                label={
                  <TranslatedText
                    stringId="medication.indication.label"
                    fallback="Indication"
                    data-test-id='translatedtext-bes6' />
                }
                component={TextField}
                disabled={readOnly}
                data-test-id='field-5uck' />
              <Field
                name="quantity"
                label={
                  <TranslatedText
                    stringId="medication.dischargeQuantity.label"
                    fallback="Discharge quantity"
                    data-test-id='translatedtext-dpen' />
                }
                min={0}
                component={NumberField}
                disabled={readOnly}
                onInput={preventNegative}
                data-test-id='field-yij6' />
              {shouldShowDiscontinuationButton && (
                <>
                  <DiscontinuePrintButtonRow>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={onDiscontinue}
                      data-test-id='button-d64n'>
                      <TranslatedText
                        stringId="medication.action.discontinue"
                        fallback="Discontinue"
                        data-test-id='translatedtext-h712' />
                    </Button>
                    <div />
                    {!shouldDiscontinue && (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={onCancel}
                          data-test-id='button-8dfm'>
                          <TranslatedText
                            stringId="general.action.close"
                            fallback="Close"
                            data-test-id='translatedtext-rdd6' />
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setPrintModalOpen(true)}
                          data-test-id='button-xjbg'>
                          <TranslatedText
                            stringId="general.action.print"
                            fallback="Print"
                            data-test-id='translatedtext-v33f' />
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
                          data-test-id='translatedtext-lwl2' />
                      }
                      component={AutocompleteField}
                      suggester={practitionerSuggester}
                      value={medication?.discontinuingClinicianId}
                      data-test-id='field-1ytk' />
                    <Field
                      name="discontinuingReason"
                      label={
                        <TranslatedText
                          stringId="medication.discontinuedReason.label"
                          fallback="Discontinued reason"
                          data-test-id='translatedtext-0szd' />
                      }
                      component={TextField}
                      data-test-id='field-939r' />
                  </>
                )}
                {medication?.discontinuedDate && <DiscontinuedLabel medication={medication} />}
              </div>
              {shouldShowSubmitButton && (
                <ButtonRow data-test-id='buttonrow-6gc8'>
                  <FormCancelButton onClick={onCancel} data-test-id='formcancelbutton-0skf'>
                    <TranslatedText
                      stringId="general.action.cancel"
                      fallback="Cancel"
                      data-test-id='translatedtext-42gn' />
                  </FormCancelButton>
                  {shouldDiscontinue ? (
                    <FormSubmitButton
                      color="primary"
                      onClick={data => {
                        setAwaitingPrint(false);
                        submitForm(data);
                      }}
                      data-test-id='formsubmitbutton-dljd'>
                      <TranslatedText
                        stringId="general.action.finalise"
                        fallback="Finalise"
                        data-test-id='translatedtext-694w' />
                    </FormSubmitButton>
                  ) : (
                    <FormSubmitDropdownButton
                      actions={[
                        {
                          label: (
                            <TranslatedText
                              stringId="general.action.finalise"
                              fallback="Finalise"
                              data-test-id='translatedtext-44sy' />
                          ),
                          onClick: data => {
                            setAwaitingPrint(false);
                            submitForm(data);
                          },
                        },
                        {
                          label: (
                            <TranslatedText
                              stringId="general.action.finaliseAndPrint"
                              fallback="Finalise & print"
                              data-test-id='translatedtext-zscq' />
                          ),
                          onClick: data => {
                            setAwaitingPrint(true);
                            submitForm(data, true);
                          },
                        },
                      ]}
                    />
                  )}
                </ButtonRow>
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
