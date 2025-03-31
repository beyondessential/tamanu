import React from 'react';
import * as yup from 'yup';
import { endOfDay, format } from 'date-fns';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
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
        data-testid='translatedtext-tas9' />
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
          data-testid='translatedtext-wc6k' />
      ),
    }}
    data-testid='translatedtext-5wwd' />
);

export const TriageForm = ({
  onCancel,
  onSubmitEncounter,
  noRedirectOnSubmit,
  patient,
  editedObject,
  initialValues,
}) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const dispatch = useDispatch();
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const triageCategories = getSetting('triageCategories');
  const practitionerSuggester = useSuggester('practitioner');
  const triageReasonSuggester = useSuggester('triageReason');

  const renderForm = ({ submitForm, values }) => {
    return (
      <FormGrid>
        <Field
          name="arrivalTime"
          label={
            <TranslatedText
              stringId="patient.modal.triage.arrivalTime.label"
              fallback="Arrival date & time"
              data-testid='translatedtext-mvou' />
          }
          component={DateTimeField}
          // Weird time picker behaviour with date.now(), so using end of day. It will be also validated on submit.
          max={format(endOfDay(new Date()), `yyyy-MM-dd'T'HH:mm`)}
          helperText="If different from triage time"
          saveDateAsString
          data-testid='field-w16w' />
        <Field
          name="triageTime"
          label={
            <TranslatedText
              stringId="patient.modal.triage.triageDateTime.label"
              fallback="Triage date & time"
              data-testid='translatedtext-vumd' />
          }
          required
          // Weird time picker behaviour with date.now(), so using end of day. It will be also validated on submit.
          max={format(endOfDay(new Date()), `yyyy-MM-dd'T'HH:mm`)}
          component={DateTimeField}
          saveDateAsString
          data-testid='field-fjx9' />
        <Field
          name="locationId"
          component={LocalisedLocationField}
          required
          data-testid='field-vgjq' />
        <LocationAvailabilityWarningMessage
          locationId={values?.locationId}
          style={{
            gridColumn: '2',
            marginBottom: '-1.2rem',
            marginTop: '-1.2rem',
            fontSize: '12px',
          }}
        />
        <LocalisedField
          name="arrivalModeId"
          label={
            <TranslatedText
              stringId="general.localisedField.arrivalModeId.label"
              fallback="Arrival mode"
              data-testid='translatedtext-wnhq' />
          }
          component={SuggesterSelectField}
          endpoint="arrivalMode"
          data-testid='localisedfield-nd1a' />
        <Field
          name="score"
          label={<InfoPopupLabel />}
          component={RadioField}
          fullWidth
          options={triageCategories?.map(x => ({ value: x.level.toString(), ...x })) || []}
          style={{ gridColumn: '1/-1' }}
          data-testid='field-ofmd' />
        <FormGrid columns={1} style={{ gridColumn: '1 / -1' }}>
          <Field
            name="chiefComplaintId"
            label={
              <TranslatedText
                stringId="patient.modal.triage.chiefComplaint.label"
                fallback="Chief complaint"
                data-testid='translatedtext-zsu7' />
            }
            component={AutocompleteField}
            suggester={triageReasonSuggester}
            required
            data-testid='field-racc' />
          <Field
            name="secondaryComplaintId"
            label={
              <TranslatedText
                stringId="patient.modal.triage.secondaryComplaint.label"
                fallback="Secondary complaint"
                data-testid='translatedtext-g54e' />
            }
            component={AutocompleteField}
            suggester={triageReasonSuggester}
            data-testid='field-tk1a' />
          <Box mt={1} mb={2}>
            <Field
              name="vitals"
              patient={patient}
              component={NestedVitalsModal}
              encounterType={ENCOUNTER_TYPES.TRIAGE}
              data-testid='field-h3l0' />
          </Box>
        </FormGrid>
        <Field
          name="practitionerId"
          label={triageClinicianLabel}
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid='field-ivcy' />
        <ModalFormActionRow
          confirmText={<TranslatedText
            stringId="general.action.submit"
            fallback="Submit"
            data-testid='translatedtext-oist' />}
          onConfirm={submitForm}
          onCancel={onCancel}
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
        answers: getAnswersFromData(data, survey),
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
      dispatch(push('/patients/emergency'));
    }
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        triageTime: getCurrentDateTimeString(),
        ...editedObject,
        ...initialValues,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
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
            data-testid='translatedtext-dj2g' />,
        ),
        practitionerId: foreignKey().translatedLabel(triageClinicianLabel),
        locationId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="general.localisedField.locationId.label"
            fallback="Location"
            data-testid='translatedtext-7fkg' />,
        ),
        score: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="patient.modal.triage.triageScore.label"
              fallback="Triage score"
              data-testid='translatedtext-fr08' />,
          ),
      })}
    />
  );
};
