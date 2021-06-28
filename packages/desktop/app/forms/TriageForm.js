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
import { ModalActionRow } from '../components/ModalActionRow';
import { NestedVitalsModal } from '../components/NestedVitalsModal';

import triageFlowchart from '../assets/images/triage-flowchart.png';

import { encounterOptions, triagePriorities } from '../constants';

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
    const {
      locationSuggester,
      practitionerSuggester,
      triageComplaintSuggester,
      onCancel,
    } = this.props;
    return (
      <FormGrid>
        <Field
          name="arrivalTime"
          label="Arrival time"
          component={DateTimeField}
          helperText="If different from triage time"
        />
        <Field
          name="locationId"
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
          options={encounterOptions}
        />
        <Field
          name="score"
          label={<InfoPopupLabel />}
          inline
          component={RadioField}
          options={triagePriorities}
        />
        <FormGrid columns={1} style={{ gridColumn: '1 / -1' }}>
          <Field
            name="chiefComplaintId"
            label="Chief complaint"
            component={AutocompleteField}
            suggester={triageComplaintSuggester}
            required
          />
          <Field
            name="secondaryComplaintId"
            label="Secondary complaint"
            component={AutocompleteField}
            suggester={triageComplaintSuggester}
          />
          <div>
            <Field name="vitals" component={NestedVitalsModal} />
          </div>
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
        <ModalActionRow confirmText="Submit triage" onConfirm={submitForm} onCancel={onCancel} />
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
          chiefComplaintId: foreignKey('Chief complaint must be selected'),
          practitionerId: foreignKey('Triage clinician must be selected'),
          locationId: foreignKey('Location must be selected'),
          score: yup
            .string()
            .oneOf(triagePriorities.map(x => x.value))
            .required(),
        })}
      />
    );
  }
}
