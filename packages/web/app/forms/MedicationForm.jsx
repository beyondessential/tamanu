import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box } from '@material-ui/core';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { foreignKey } from '../utils/validation';
import { PrintPrescriptionModal } from '../components/PatientPrinting';
import { FormSubmitDropdownButton } from '../components/DropdownButton';
import {
  AutocompleteField,
  Button,
  ButtonRow,
  DateDisplay,
  DateField,
  Field,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  NumberField,
  SelectField,
  TextField,
} from '../components';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

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

const validationSchema = readOnly =>
  !readOnly
    ? yup.object().shape({
        medicationId: foreignKey().label('medication'),
        prescriberId: foreignKey().label('prescriber'),
        prescription: yup
          .string()
          .required()
          .label('instructions'),
        route: yup
          .string()
          .oneOf(drugRouteOptions.map(x => x.value))
          .required(),
        date: yup.date().required(),
        endDate: yup.date(),
        note: yup.string(),
        quantity: yup.number().integer(),
      })
    : yup.object().shape({
        discontinuingReason: yup.string(),
        discontinuingClinicianId: foreignKey().label('clinician'),
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
        <TranslatedText stringId="medication.detail.discontinued.title" fallback="Discontinued" />
      </strong>
      <br />
      <TranslatedText
        stringId="medication.detail.discontinued.discontinuedAt"
        fallback="Discontinued at: :date"
        replacements={{ date: <DateDisplay date={discontinuedDate} /> }}
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
    const shouldShowDiscontinuationButton = readOnly && !medication?.discontinued;
    const shouldShowSubmitButton = !readOnly || shouldDiscontinue;

    const [printModalOpen, setPrintModalOpen] = useState();
    const [awaitingPrint, setAwaitingPrint] = useState(false);

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
          formType={!readOnly && (medication ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM)}
          validationSchema={validationSchema(readOnly)}
          render={({ submitForm }) => (
            <FormGrid>
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
              <Field
                name="prescription"
                label={
                  <TranslatedText
                    stringId="medication.instructions.label"
                    fallback="Instructions"
                  />
                }
                component={TextField}
                required={!readOnly}
                disabled={readOnly}
              />
              <Field
                name="route"
                label={
                  <TranslatedText stringId="medication.route.label" fallback="Route of admission" />
                }
                component={SelectField}
                options={drugRouteOptions}
                disabled={readOnly}
                required={!readOnly}
                prefix="medication.property.route"
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
                name="endDate"
                label={<TranslatedText stringId="medication.endDate.label" fallback="End date" />}
                saveDateAsString
                component={DateField}
                disabled={readOnly}
                value={medication?.endDate}
              />
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
                name="note"
                label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
                component={TextField}
                style={{ gridColumn: '1/-1' }}
                disabled={readOnly}
              />
              <FormGrid nested>
                <h3 style={{ gridColumn: '1/-1' }}>Quantity</h3>
                <Field
                  name="qtyMorning"
                  label={
                    <TranslatedText
                      stringId="medication.quantityMorning.label"
                      fallback="Morning"
                    />
                  }
                  min={0}
                  component={NumberField}
                  onInput={preventNegative}
                  disabled={readOnly}
                />
                <Field
                  name="qtyLunch"
                  min={0}
                  label={
                    <TranslatedText stringId="medication.quantityLunch.label" fallback="Lunch" />
                  }
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                />
                <Field
                  name="qtyEvening"
                  label={
                    <TranslatedText
                      stringId="medication.quantityEvening.label"
                      fallback="Evening"
                    />
                  }
                  min={0}
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                />
                <Field
                  name="qtyNight"
                  label={
                    <TranslatedText stringId="medication.quantityNight.label" fallback="Night" />
                  }
                  min={0}
                  component={NumberField}
                  disabled={readOnly}
                  onInput={preventNegative}
                />
              </FormGrid>
              <Field
                name="indication"
                label={
                  <TranslatedText stringId="medication.indication.label" fallback="Indication" />
                }
                component={TextField}
                disabled={readOnly}
              />
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
              {shouldShowDiscontinuationButton && (
                <>
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
                <ButtonRow>
                  <FormCancelButton onClick={onCancel}>
                    <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                  </FormCancelButton>
                  {shouldDiscontinue ? (
                    <FormSubmitButton
                      color="primary"
                      onClick={data => {
                        setAwaitingPrint(false);
                        submitForm(data);
                      }}
                    >
                      <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
                    </FormSubmitButton>
                  ) : (
                    <FormSubmitDropdownButton
                      actions={[
                        {
                          label: (
                            <TranslatedText
                              stringId="general.action.finalise"
                              fallback="Finalise"
                            />
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
                            />
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
