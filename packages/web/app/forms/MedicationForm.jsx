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

const validationSchema = (readOnly) =>
  !readOnly
    ? yup.object().shape({
        medicationId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="medication.medication.label"
            fallback="Medication"
            data-testid="translatedtext-c8oy"
          />,
        ),
        prescriberId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="medication.prescriber.label"
            fallback="Prescriber"
            data-testid="translatedtext-7u09"
          />,
        ),
        prescription: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="medication.instructions.label"
              fallback="Instructions"
              data-testid="translatedtext-nr1l"
            />,
          ),
        route: yup
          .string()
          .oneOf(DRUG_ROUTE_VALUES)
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="medication.route.label"
              fallback="Route"
              data-testid="translatedtext-luwu"
            />,
          ),
        date: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.date.label"
              fallback="Date"
              data-testid="translatedtext-1qvy"
            />,
          ),
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
            data-testid="translatedtext-dlnz"
          />,
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
    <Box color="error.main" ml={2} data-testid="box-jj8h">
      <strong>
        <TranslatedText
          stringId="medication.detail.discontinued.title"
          fallback="Discontinued"
          data-testid="translatedtext-xct7"
        />
      </strong>
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.discontinuedAt"
        fallback="Discontinued at: :date"
        replacements={{ date: getDateDisplay(discontinuedDate) }}
        data-testid="translatedtext-aznb"
      />
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.discontinuedBy"
        fallback="by: :clinician"
        replacements={{ clinician: discontinuingClinician?.displayName }}
        data-testid="translatedtext-zr6k"
      />
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.reason"
        fallback="Reason: :reason"
        replacements={{ reason: discontinuingReason }}
        data-testid="translatedtext-zdh3"
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

    const patient = useSelector((state) => state.patient);
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
      ?.map((allergyDetail) =>
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

    const preventNegative = (value) => {
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
            <FormGrid data-testid="formgrid-pela">
              <div style={{ gridColumn: '1 / -1' }}>
                <TranslatedText
                  stringId="medication.allergies.title"
                  fallback="Allergies"
                  data-testid="translatedtext-8uvx"
                />
                :{' '}
                <span style={{ fontWeight: 500 }}>
                  {!isLoadingAllergies &&
                    (allergiesList || (
                      <TranslatedText
                        stringId="medication.allergies.noRecord"
                        fallback="None recorded"
                        data-testid="translatedtext-1kvf"
                      />
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
                      data-testid="translatedtext-aplb"
                    />
                  }
                  component={AutocompleteField}
                  suggester={drugSuggester}
                  disabled={readOnly}
                  required={!readOnly}
                  data-testid="field-f5s3"
                />
              </div>
              <Field
                name="prescription"
                label={
                  <TranslatedText
                    stringId="medication.instructions.label"
                    fallback="Instructions"
                    data-testid="translatedtext-x0vq"
                  />
                }
                component={TextField}
                required={!readOnly}
                disabled={readOnly}
                data-testid="field-qdf3"
              />
              <Field
                name="route"
                label={
                  <TranslatedText
                    stringId="medication.route.label"
                    fallback="Route of admission"
                    data-testid="translatedtext-g77v"
                  />
                }
                component={TranslatedSelectField}
                enumValues={DRUG_ROUTE_LABELS}
                disabled={readOnly}
                required={!readOnly}
                data-testid="field-2gbg"
              />
              <Field
                name="date"
                label={
                  <TranslatedText
                    stringId="medication.date.label"
                    fallback="Prescription date"
                    data-testid="translatedtext-c8ij"
                  />
                }
                saveDateAsString
                component={DateField}
                required={!readOnly}
                disabled={readOnly}
                data-testid="field-elvq"
              />
              <Field
                name="endDate"
                label={
                  <TranslatedText
                    stringId="medication.endDate.label"
                    fallback="End date"
                    data-testid="translatedtext-900v"
                  />
                }
                saveDateAsString
                component={DateField}
                disabled={readOnly}
                value={medication?.endDate}
                data-testid="field-h4xs"
              />
              <Field
                name="prescriberId"
                label={
                  <TranslatedText
                    stringId="medication.prescriber.label"
                    fallback="Prescriber"
                    data-testid="translatedtext-017g"
                  />
                }
                component={AutocompleteField}
                suggester={practitionerSuggester}
                required={!readOnly}
                disabled={readOnly}
                data-testid="field-bsn1"
              />
              {showPatientWeight && (
                <Field
                  name="patientWeight"
                  label={
                    <TranslatedText
                      stringId="medication.patientWeight.label"
                      fallback="Patient weight :unit"
                      replacements={{ unit: `(${weightUnit})` }}
                      data-testid="translatedtext-h78x"
                    />
                  }
                  onChange={(e) => setPatientWeight(e.target.value)}
                  component={TextField}
                  placeholder={getTranslation('medication.patientWeight.placeholder', 'e.g 2.4')}
                  type="number"
                  data-testid="field-2hh7"
                />
              )}
              <Field
                name="note"
                label={
                  <TranslatedText
                    stringId="general.notes.label"
                    fallback="Notes"
                    data-testid="translatedtext-9x80"
                  />
                }
                component={TextField}
                style={{ gridColumn: '1/-1' }}
                disabled={readOnly}
                data-testid="field-h0cv"
              />
              <FormGrid nested data-testid="formgrid-8yrs">
                <h3 style={{ gridColumn: '1/-1' }}>Quantity</h3>
                <Field
                  name="qtyMorning"
                  label={
                    <TranslatedText
                      stringId="medication.quantityMorning.label"
                      fallback="Morning"
                      data-testid="translatedtext-ovll"
                    />
                  }
                  min={0}
                  component={NumberField}
                  onInput={preventNegative}
                  disabled={readOnly}
                  data-testid="field-1j7n"
                />
                <Field
                  name="qtyLunch"
                  min={0}
                  label={
                    <TranslatedText
                      stringId="medication.quantityLunch.label"
                      fallback="Lunch"
                      data-testid="translatedtext-3o81"
                    />
                  }
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                  data-testid="field-lmp4"
                />
                <Field
                  name="qtyEvening"
                  label={
                    <TranslatedText
                      stringId="medication.quantityEvening.label"
                      fallback="Evening"
                      data-testid="translatedtext-08n7"
                    />
                  }
                  min={0}
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                  data-testid="field-2zog"
                />
                <Field
                  name="qtyNight"
                  label={
                    <TranslatedText
                      stringId="medication.quantityNight.label"
                      fallback="Night"
                      data-testid="translatedtext-x2hw"
                    />
                  }
                  min={0}
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                  data-testid="field-omhb"
                />
              </FormGrid>
              <Field
                name="indication"
                label={
                  <TranslatedText
                    stringId="medication.indication.label"
                    fallback="Indication"
                    data-testid="translatedtext-lbii"
                  />
                }
                component={TextField}
                disabled={readOnly}
                data-testid="field-x2c0"
              />
              <Field
                name="quantity"
                label={
                  <TranslatedText
                    stringId="medication.dischargeQuantity.label"
                    fallback="Discharge quantity"
                    data-testid="translatedtext-zejj"
                  />
                }
                min={0}
                component={NumberField}
                disabled={readOnly}
                onInput={preventNegative}
                data-testid="field-09n9"
              />
              {shouldShowDiscontinuationButton && (
                <>
                  <DiscontinuePrintButtonRow data-testid="discontinueprintbuttonrow-kduu">
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={onDiscontinue}
                      data-testid="button-wlpi"
                    >
                      <TranslatedText
                        stringId="medication.action.discontinue"
                        fallback="Discontinue"
                        data-testid="translatedtext-lwzq"
                      />
                    </Button>
                    <div />
                    {!shouldDiscontinue && (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={onCancel}
                          data-testid="button-97tw"
                        >
                          <TranslatedText
                            stringId="general.action.close"
                            fallback="Close"
                            data-testid="translatedtext-3b17"
                          />
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setPrintModalOpen(true)}
                          data-testid="button-p5az"
                        >
                          <TranslatedText
                            stringId="general.action.print"
                            fallback="Print"
                            data-testid="translatedtext-31yc"
                          />
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
                          data-testid="translatedtext-0zdy"
                        />
                      }
                      component={AutocompleteField}
                      suggester={practitionerSuggester}
                      value={medication?.discontinuingClinicianId}
                      data-testid="field-ecms"
                    />
                    <Field
                      name="discontinuingReason"
                      label={
                        <TranslatedText
                          stringId="medication.discontinuedReason.label"
                          fallback="Discontinued reason"
                          data-testid="translatedtext-rr66"
                        />
                      }
                      component={TextField}
                      data-testid="field-fgi9"
                    />
                  </>
                )}
                {medication?.discontinuedDate && (
                  <DiscontinuedLabel medication={medication} data-testid="discontinuedlabel-g4fk" />
                )}
              </div>
              {shouldShowSubmitButton && (
                <ButtonRow data-testid="buttonrow-iqds">
                  <FormCancelButton onClick={onCancel} data-testid="formcancelbutton-8vc4">
                    <TranslatedText
                      stringId="general.action.cancel"
                      fallback="Cancel"
                      data-testid="translatedtext-8bv7"
                    />
                  </FormCancelButton>
                  {shouldDiscontinue ? (
                    <FormSubmitButton
                      color="primary"
                      onClick={(data) => {
                        setAwaitingPrint(false);
                        submitForm(data);
                      }}
                      data-testid="formsubmitbutton-gugw"
                    >
                      <TranslatedText
                        stringId="general.action.finalise"
                        fallback="Finalise"
                        data-testid="translatedtext-0zlp"
                      />
                    </FormSubmitButton>
                  ) : (
                    <FormSubmitDropdownButton
                      actions={[
                        {
                          label: (
                            <TranslatedText
                              stringId="general.action.finalise"
                              fallback="Finalise"
                              data-testid="translatedtext-su4g"
                            />
                          ),
                          onClick: (data) => {
                            setAwaitingPrint(false);
                            submitForm(data);
                          },
                        },
                        {
                          label: (
                            <TranslatedText
                              stringId="general.action.finaliseAndPrint"
                              fallback="Finalise & print"
                              data-testid="translatedtext-2yks"
                            />
                          ),
                          onClick: (data) => {
                            setAwaitingPrint(true);
                            submitForm(data, true);
                          },
                        },
                      ]}
                      data-testid="formsubmitdropdownbutton-wmse"
                    />
                  )}
                </ButtonRow>
              )}
            </FormGrid>
          )}
          data-testid="form-6l29"
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
            data-testid="printprescriptionmodal-2m30"
          />
        )}
      </>
    );
  },
);
