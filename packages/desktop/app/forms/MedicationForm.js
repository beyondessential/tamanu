import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box } from '@material-ui/core';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { foreignKey } from '../utils/validation';
import { PrintPrescriptionModal } from '../components/PatientPrinting';
import { DropdownButton } from '../components/DropdownButton';
import {
  FormGrid,
  Button,
  ButtonRow,
  Form,
  Field,
  SelectField,
  TextField,
  AutocompleteField,
  NumberField,
  DateField,
  DateDisplay,
} from '../components';

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
        medicationId: foreignKey('Medication must be selected'),
        prescriberId: foreignKey('Prescriber must be selected'),
        prescription: yup.string().required('Instructions are required'),
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
        discontinuingClinicianId: foreignKey('Clinician must be selected'),
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
      <strong>Discontinued</strong>
      <br />
      Discontinued at: <DateDisplay date={discontinuedDate} />
      <br />
      by: {discontinuingClinician?.displayName}
      <br />
      Reason: {discontinuingReason}
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
          validationSchema={validationSchema(readOnly)}
          render={({ submitForm }) => (
            <FormGrid>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field
                  name="medicationId"
                  label="Medication"
                  component={AutocompleteField}
                  suggester={drugSuggester}
                  disabled={readOnly}
                  required={!readOnly}
                />
              </div>
              <Field
                name="prescription"
                label="Instructions"
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
              <Field
                name="date"
                label="Prescription date"
                saveDateAsString
                component={DateField}
                required={!readOnly}
                disabled={readOnly}
              />
              <Field
                name="endDate"
                label="End date"
                saveDateAsString
                component={DateField}
                disabled={readOnly}
                value={medication?.endDate}
              />
              <Field
                name="prescriberId"
                label="Prescriber"
                component={AutocompleteField}
                suggester={practitionerSuggester}
                required={!readOnly}
                disabled={readOnly}
              />
              <Field
                name="note"
                label="Notes"
                component={TextField}
                style={{ gridColumn: '1/-1' }}
                disabled={readOnly}
              />
              <FormGrid nested>
                <h3 style={{ gridColumn: '1/-1' }}>Quantity</h3>
                <Field
                  name="qtyMorning"
                  label="Morning"
                  component={NumberField}
                  disabled={readOnly}
                />
                <Field name="qtyLunch" label="Lunch" component={NumberField} disabled={readOnly} />
                <Field
                  name="qtyEvening"
                  label="Evening"
                  component={NumberField}
                  disabled={readOnly}
                />
                <Field name="qtyNight" label="Night" component={NumberField} disabled={readOnly} />
              </FormGrid>
              <Field
                name="indication"
                label="Indication"
                component={TextField}
                disabled={readOnly}
              />
              <Field
                name="quantity"
                label="Discharge quantity"
                component={NumberField}
                disabled={readOnly}
              />
              {shouldShowDiscontinuationButton && (
                <>
                  <DiscontinuePrintButtonRow>
                    <Button variant="outlined" color="primary" onClick={onDiscontinue}>
                      Discontinue
                    </Button>
                    <div />
                    {!shouldDiscontinue && (
                      <>
                        <Button variant="outlined" color="primary" onClick={onCancel}>
                          Close
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setPrintModalOpen(true)}
                        >
                          Print
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
                      label="Discontinued by"
                      component={AutocompleteField}
                      suggester={practitionerSuggester}
                      value={medication?.discontinuingClinicianId}
                    />
                    <Field
                      name="discontinuingReason"
                      label="Discontinued reason"
                      component={TextField}
                    />
                  </>
                )}
                {medication?.discontinuedDate && <DiscontinuedLabel medication={medication} />}
              </div>
              {shouldShowSubmitButton && (
                <ButtonRow>
                  <Button variant="outlined" color="primary" onClick={onCancel}>
                    Cancel
                  </Button>
                  {shouldDiscontinue ? (
                    <Button
                      color="primary"
                      onClick={data => {
                        setAwaitingPrint(false);
                        submitForm(data);
                      }}
                    >
                      Finalise
                    </Button>
                  ) : (
                    <DropdownButton
                      actions={[
                        {
                          label: 'Finalise',
                          onClick: data => {
                            setAwaitingPrint(false);
                            submitForm(data);
                          },
                        },
                        {
                          label: 'Finalise & print',
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
