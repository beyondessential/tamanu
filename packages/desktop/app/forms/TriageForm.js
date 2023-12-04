import React from 'react';
import * as yup from 'yup';
import { format, endOfDay } from 'date-fns';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { Box } from '@material-ui/core';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { foreignKey } from '../utils/validation';
import {
  Form,
  Field,
  LocalisedField,
  SuggesterSelectField,
  DateTimeField,
  AutocompleteField,
  RadioField,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { NestedVitalsModal } from '../components/NestedVitalsModal';
import { useApi, useSuggester } from '../api';
import { useLocalisation } from '../contexts/Localisation';
import { getActionsFromData, getAnswersFromData } from '../utils';
import { useLocalisedText } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';

const InfoPopupLabel = React.memo(() => (
  <span>
    <span>
      <TranslatedText
        stringId="patient.modal.triage.form.score.infoPopup"
        fallback="Triage score"
      />
    </span>
    {/* Todo: convert triage flow chart to a configurable asset */}
    {/* <ImageInfoModal src={triageFlowchart} /> */}
  </span>
));

export const TriageForm = ({
  onCancel,
  onSubmitEncounter,
  noRedirectOnSubmit,
  patient,
  editedObject,
}) => {
  const api = useApi();
  const dispatch = useDispatch();
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
  const { getLocalisation } = useLocalisation();
  const triageCategories = getLocalisation('triageCategories');
  const practitionerSuggester = useSuggester('practitioner');
  const triageReasonSuggester = useSuggester('triageReason');

  const renderForm = ({ submitForm, values }) => {
    return (
      <FormGrid>
        <Field
          name="arrivalTime"
          label={
            <TranslatedText
              stringId="patient.modal.triage.form.arrivalTime.label"
              fallback="Arrival date & time"
            />
          }
          component={DateTimeField}
          max={format(endOfDay(new Date()), `yyyy-MM-dd'T'HH:mm`)} // Weird time picker behaviour with date.now(), so using end of day. It will be also validated on submit.
          helperText="If different from triage time"
          saveDateAsString
        />
        <Field
          name="triageTime"
          label={
            <TranslatedText
              stringId="patient.modal.triage.form.triageTime.label"
              fallback="Triage date & time"
            />
          }
          required
          max={format(endOfDay(new Date()), `yyyy-MM-dd'T'HH:mm`)} // Weird time picker behaviour with date.now(), so using end of day. It will be also validated on submit.
          component={DateTimeField}
          saveDateAsString
        />
        <Field name="locationId" component={LocalisedLocationField} required />
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
          component={SuggesterSelectField}
          endpoint="arrivalMode"
        />
        <Field
          name="score"
          label={<InfoPopupLabel />}
          component={RadioField}
          fullWidth
          options={triageCategories?.map(x => ({ value: x.level.toString(), ...x })) || []}
          style={{ gridColumn: '1/-1' }}
        />
        <FormGrid columns={1} style={{ gridColumn: '1 / -1' }}>
          <Field
            name="chiefComplaintId"
            label={
              <TranslatedText
                stringId="patient.modal.triage.form.chiefComplaint.label"
                fallback="Chief complaint"
              />
            }
            component={AutocompleteField}
            suggester={triageReasonSuggester}
            required
          />
          <Field
            name="secondaryComplaintId"
            label={
              <TranslatedText
                stringId="patient.modal.triage.form.secondaryComplaint.label"
                fallback="Secondary complaint"
              />
            }
            component={AutocompleteField}
            suggester={triageReasonSuggester}
          />
          <Box mt={1} mb={2}>
            <Field
              name="vitals"
              patient={patient}
              component={NestedVitalsModal}
              encounterType={ENCOUNTER_TYPES.TRIAGE}
            />
          </Box>
        </FormGrid>
        <Field
          name="practitionerId"
          label={
            <TranslatedText
              stringId="patient.modal.triage.form.practitioner.label"
              fallback="Triage :practitioner"
              replacements={{ practitioner: clinicianText.toLowerCase() }}
            />
          }
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <ModalFormActionRow
          confirmText={<TranslatedText stringId="general.action.submit" fallback="submit" />}
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
        actions: getActionsFromData(data, survey),
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
      }}
      validationSchema={yup.object().shape({
        arrivalTime: yup.date().max(new Date(), 'Arrival time cannot be in the future'),
        triageTime: yup
          .date()
          .required()
          .max(new Date(), 'Triage time cannot be in the future'),
        chiefComplaintId: foreignKey('Chief complaint must be selected'),
        practitionerId: foreignKey(`Triage ${clinicianText.toLowerCase()} must be selected`),
        locationId: foreignKey('Location must be selected'),
        score: yup.string().required(),
      })}
    />
  );
};
