import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  DateTimeField,
  AutocompleteField,
  TextField,
  RadioField,
  CheckField,
} from '../components/Field';
import { ImageInfoModal } from '../components/InfoModal';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';

import triageFlowchart from '../assets/images/triage-flowchart.png';

import { visitOptions } from '../constants';

const trafficLights = [
  { value: '3', label: 'Non-urgent' },
  { value: '2', label: 'Priority' },
  { value: '1', label: 'Emergency' },
];

const InfoPopupLabel = React.memo(() => (
  <span>
    <span>Triage score </span>
    <ImageInfoModal src={triageFlowchart} />
  </span>
));

export class TriageForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ submitForm }) => {
    const { locationSuggester, practitionerSuggester, editedObject } = this.props;
    const buttonText = editedObject ? 'Update visit' : 'Start visit';
    return (
      <FormGrid>
        <Field
          name="arrivalTime"
          label="Arrival time"
          component={DateTimeField}
          helperText="If different from triage time"
        />
        <Field
          name="location._id"
          label="Location"
          required
          component={AutocompleteField}
          suggester={locationSuggester}
        />
        <Field
          name="triageTime"
          label="Triage time"
          required
          component={DateTimeField}
          options={visitOptions}
        />
        <Field
          name="score"
          label={<InfoPopupLabel />}
          inline
          component={RadioField}
          options={trafficLights}
        />
        <FormGrid columns={1} style={{ gridColumn: '1 / -1' }}>
          <Field
            name="reasonForVisit"
            label="Reason for visit"
            component={TextField}
            multiline
            rows={2}
          />
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
            label="Have any medicines already been taken? (include time taken if known)"
            component={TextField}
            multiline
            rows={3}
          />
        </FormGrid>
        <Field
          name="practitioner._id"
          label="Triage nurse/doctor"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <ButtonRow>
          <Button variant="contained" onClick={submitForm} color="primary">
            {buttonText}
          </Button>
        </ButtonRow>
      </FormGrid>
    );
  };

  onSubmit = values => {
    const { onSubmit } = this.props;

    // These fields are just stored in the database as a single freetext note, so assign
    // strings and concatenate
    const notes = [
      values.checkLostConsciousness && 'Patient received a blow to the head or lost consciousness',
      values.checkPregnant && 'Patient is pregnant (or possibly pregnant)',
      values.checkDrugsOrAlcohol && 'Patient has had drugs or alcohol',
      values.checkCrime && 'A crime has possibly been committed',
      values.medicineNotes,
    ];

    const updatedValues = {
      ...values,
      notes: notes
        .map(x => x && x.trim())
        .filter(x => x)
        .join('\n'),
    };

    onSubmit(updatedValues);
  };

  render() {
    const { editedObject } = this.props;
    return (
      <Form
        onSubmit={this.onSubmit}
        render={this.renderForm}
        initialValues={{
          triageTime: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          triageTime: yup.date().required(),
          practitioner: foreignKey('Triage nurse/doctor must be selected'),
          score: yup
            .string()
            .oneOf(trafficLights.map(x => x.value))
            .required(),
        })}
      />
    );
  }
}
