import React from 'react';
import * as yup from 'yup';
import { push } from 'connected-react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@material-ui/core';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { foreignKey } from '../utils/validation';
import {
  Form,
  Field,
  LocalisedField,
  SuggesterSelectField,
  DateTimeField,
  AutocompleteField,
  TextField,
  RadioField,
  CheckField,
  LocalisedLocationField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalActionRow } from '../components/ModalActionRow';
import { NestedVitalsModal } from '../components/NestedVitalsModal';
import { useApi, useSuggester } from '../api';
import { useLocalisation } from '../contexts/Localisation';
import { getActionsFromData, getAnswersFromData } from '../utils';

const InfoPopupLabel = React.memo(() => (
  <span>
    <span>Triage score </span>
    {/* Todo: convert triage flow chart to a configurable asset */}
    {/* <ImageInfoModal src={triageFlowchart} /> */}
  </span>
));

export const TriageForm = ({ onCancel, editedObject }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const patient = useSelector(state => state.patient);
  const { getLocalisation } = useLocalisation();
  const triageCategories = getLocalisation('triageCategories');
  const practitionerSuggester = useSuggester('practitioner');
  const triageReasonSuggester = useSuggester('triageReason');

  const renderForm = ({ submitForm }) => {
    return (
      <FormGrid>
        <Field
          name="arrivalTime"
          label="Arrival date & time"
          component={DateTimeField}
          helperText="If different from triage time"
          saveDateAsString
        />
        <Field
          name="triageTime"
          label="Triage date & time"
          required
          component={DateTimeField}
          saveDateAsString
        />
        <Field name="locationId" component={LocalisedLocationField} required />
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
            label="Chief complaint"
            component={AutocompleteField}
            suggester={triageReasonSuggester}
            required
          />
          <Field
            name="secondaryComplaintId"
            label="Secondary complaint"
            component={AutocompleteField}
            suggester={triageReasonSuggester}
          />
          <Box mt={1} mb={2}>
            <Field name="vitals" patient={patient} component={NestedVitalsModal} />
          </Box>
          <Field
            name="checkLostConsciousness"
            label="Did the patient receive a blow to the head or lose consciousness at any time?"
            component={CheckField}
          />
          <Field
            name="checkPregnant"
            label="Is the patient pregnant (or could they possibly be pregnant)?"
            component={CheckField}
          />
          <Field
            name="checkDrugsOrAlcohol"
            label="Has the patient had any alcohol or other drugs recently?"
            component={CheckField}
          />
          <Field
            name="checkCrime"
            label="Has a crime possibly been committed?"
            helperText="(if so, please follow additional reporting procedures as per department protocols)"
            component={CheckField}
          />
          <Field
            name="medicineNotes"
            label="Have any medicines been taken in the last 12 hours? (include time taken if known)"
            component={TextField}
            multiline
            rows={3}
          />
        </FormGrid>
        <Field
          name="practitionerId"
          label="Triage clinician"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <ModalActionRow confirmText="Submit" onConfirm={submitForm} onCancel={onCancel} />
      </FormGrid>
    );
  };

  const onSubmit = async values => {
    // These fields are just stored in the database as a single freetext note, so assign
    // strings and concatenate
    const notes = [
      values.checkLostConsciousness && 'Patient received a blow to the head or lost consciousness',
      values.checkPregnant && 'Patient is pregnant (or possibly pregnant)',
      values.checkDrugsOrAlcohol && 'Patient has had drugs or alcohol',
      values.checkCrime && 'A crime has possibly been committed',
      values.medicineNotes,
    ];

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
      notes: notes
        .map(x => x && x.trim())
        .filter(x => x)
        .join('\n'),
      vitals: updatedVitals,
    };

    await api.post('triage', {
      ...updatedValues,
      startDate: getCurrentDateTimeString(),
      patientId: patient.id,
    });
    dispatch(push('/patients/emergency'));
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
        triageTime: yup.date().required(),
        chiefComplaintId: foreignKey('Chief complaint must be selected'),
        practitionerId: foreignKey('Triage clinician must be selected'),
        locationId: foreignKey('Location must be selected'),
        score: yup.string().required(),
      })}
    />
  );
};
