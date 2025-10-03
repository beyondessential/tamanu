import React from 'react';
import * as yup from 'yup';
import { endOfDay, format } from 'date-fns';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { useNavigate } from 'react-router-dom';
import { Box } from '@material-ui/core';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { foreignKey } from '../utils/validation';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  Form,
  LocalisedField,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  RadioField,
  SuggesterSelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { NestedVitalsModal } from '../components/NestedVitalsModal';
import { useApi, useSuggester } from '../api';
import { getAnswersFromData } from '../utils';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { useSettings } from '../contexts/Settings';
import { useAuth } from '../contexts/Auth';

const InfoPopupLabel = React.memo(() => (
  <span>
    <span>
      <TranslatedText
        stringId="patient.modal.triage.triageScore.label"
        fallback="Triage score"
        data-testid="translatedtext-0xff"
      />
    </span>
    {/* Todo: convert triage flow chart to a configurable asset */}
    {/* <ImageInfoModal src={triageFlowchart} /> */}
  </span>
));

const triageClinicianLabel = (
  <TranslatedText
    stringId="triage.practitionerId.label"
    fallback="Triage :clinician"
    replacements={{
      clinician: (
        <TranslatedText
          stringId="general.localisedField.clinician.label.short"
          fallback="Clinician"
          casing="lower"
          data-testid="translatedtext-49q5"
        />
      ),
    }}
    data-testid="translatedtext-74wy"
  />
);

export const TriageForm = ({
  onCancel,
  onSubmitEncounter,
  noRedirectOnSubmit,
  patient,
  initialValues,
}) => {
  const api = useApi();
  const { facilityId, currentUser } = useAuth();
  const navigate = useNavigate();
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const triageCategories = getSetting('triageCategories');
  const practitionerSuggester = useSuggester('practitioner');
  const triageReasonSuggester = useSuggester('triageReason');

  const renderForm = ({ submitForm, values }) => {
    return (
      <FormGrid data-testid="formgrid-edou">
        <Field
          name="arrivalTime"
          label={
            <TranslatedText
              stringId="patient.modal.triage.arrivalTime.label"
              fallback="Arrival date & time"
              data-testid="translatedtext-zyga"
            />
          }
          component={DateTimeField}
          // Weird time picker behaviour with date.now(), so using end of day. It will be also validated on submit.
          max={format(endOfDay(new Date()), `yyyy-MM-dd'T'HH:mm`)}
          helperText="If different from triage time"
          saveDateAsString
          data-testid="field-mhav"
        />
        <Field
          name="triageTime"
          label={
            <TranslatedText
              stringId="patient.modal.triage.triageDateTime.label"
              fallback="Triage date & time"
              data-testid="translatedtext-wjwo"
            />
          }
          required
          // Weird time picker behaviour with date.now(), so using end of day. It will be also validated on submit.
          max={format(endOfDay(new Date()), `yyyy-MM-dd'T'HH:mm`)}
          component={DateTimeField}
          saveDateAsString
          data-testid="field-9hxy"
        />
        <Field
          name="locationId"
          component={LocalisedLocationField}
          required
          data-testid="field-ipih"
        />
        <LocationAvailabilityWarningMessage
          locationId={values?.locationId}
          style={{
            gridColumn: '2',
            marginBottom: '-1.2rem',
            marginTop: '-1.2rem',
            fontSize: '12px',
          }}
          data-testid="locationavailabilitywarningmessage-3gl4"
        />
        <LocalisedField
          name="arrivalModeId"
          label={
            <TranslatedText
              stringId="general.localisedField.arrivalModeId.label"
              fallback="Arrival mode"
              data-testid="translatedtext-7qdb"
            />
          }
          component={SuggesterSelectField}
          endpoint="arrivalMode"
          data-testid="localisedfield-hjex"
        />
        <Field
          name="score"
          label={<InfoPopupLabel data-testid="infopopuplabel-5isv" />}
          component={RadioField}
          fullWidth
          options={triageCategories?.map(x => ({ value: x.level.toString(), ...x })) || []}
          style={{ gridColumn: '1/-1' }}
          data-testid="field-4vw2"
        />
        <FormGrid columns={1} style={{ gridColumn: '1 / -1' }} data-testid="formgrid-96e8">
          <Field
            name="chiefComplaintId"
            label={
              <TranslatedText
                stringId="patient.modal.triage.chiefComplaint.label"
                fallback="Chief complaint"
                data-testid="translatedtext-tdrb"
              />
            }
            component={AutocompleteField}
            suggester={triageReasonSuggester}
            required
            data-testid="field-a7cu"
          />
          <Field
            name="secondaryComplaintId"
            label={
              <TranslatedText
                stringId="patient.modal.triage.secondaryComplaint.label"
                fallback="Secondary complaint"
                data-testid="translatedtext-1xyf"
              />
            }
            component={AutocompleteField}
            suggester={triageReasonSuggester}
            data-testid="field-1ktz"
          />
          <Box mt={1} mb={2} data-testid="box-78hi">
            <Field
              name="vitals"
              patient={patient}
              component={NestedVitalsModal}
              encounterType={ENCOUNTER_TYPES.TRIAGE}
              data-testid="field-6t8l"
            />
          </Box>
        </FormGrid>
        <Field
          name="practitionerId"
          label={triageClinicianLabel}
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid="field-388u"
        />
        <ModalFormActionRow
          confirmText={
            <TranslatedText
              stringId="general.action.submit"
              fallback="Submit"
              data-testid="translatedtext-lvb6"
            />
          }
          onConfirm={submitForm}
          onCancel={onCancel}
          data-testid="modalformactionrow-8t8n"
        />
      </FormGrid>
    );
  };

  const onSubmit = async values => {
    // Convert the vitals to a surveyResponse submission format
    let updatedVitals = null;
    if (values.vitals) {
      const { survey, ...data } = values.vitals;
      updatedVitals = {
        surveyId: survey.id,
        startTime: getCurrentDateTimeString(),
        endTime: getCurrentDateTimeString(),
        patientId: patient.id,
        answers: await getAnswersFromData(data, survey),
      };
    }

    const updatedValues = {
      ...values,
      vitals: updatedVitals,
    };

    const newTriage = {
      ...updatedValues,
      startDate: getCurrentDateTimeString(),
      patientId: patient.id,
      facilityId,
    };

    if (typeof onSubmitEncounter === 'function') {
      onSubmitEncounter(newTriage);
    }

    await api.post('triage', newTriage);

    if (!noRedirectOnSubmit) {
      navigate('/patients/emergency');
    }
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        triageTime: getCurrentDateTimeString(),
        practitionerId: currentUser.id,
        ...initialValues,
      }}
      formType={FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        arrivalTime: yup
          .date()
          .max(
            new Date(),
            getTranslation(
              'validation.rule.arrivalTimeNotInFuture',
              'Arrival time cannot be in the future',
            ),
          ),
        triageTime: yup
          .date()
          .required()
          .max(
            new Date(),
            getTranslation(
              'validation.rule.triageTimeNotInFuture',
              'Triage time cannot be in the future',
            ),
          ),
        chiefComplaintId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="patient.modal.triage.chiefComplaint.label"
            fallback="Chief complaint"
            data-testid="translatedtext-5pa3"
          />,
        ),
        practitionerId: foreignKey().translatedLabel(triageClinicianLabel),
        locationId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="general.localisedField.locationId.label"
            fallback="Location"
            data-testid="translatedtext-77o5"
          />,
        ),
        score: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="patient.modal.triage.triageScore.label"
              fallback="Triage score"
              data-testid="translatedtext-h7i8"
            />,
          ),
      })}
      data-testid="form-icik"
    />
  );
};
