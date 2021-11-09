import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import shortid from 'shortid';
import { connect } from 'react-redux';

import { foreignKey } from '../utils/validation';
import { encounterOptions } from '../constants';
import { getImagingTypes, loadOptions } from '../store/options';

import {
  Form,
  Field,
  DateField,
  SelectField,
  AutocompleteField,
  TextField,
  DateTimeField,
  CheckField,
  TextInput,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { DateDisplay } from '../components/DateDisplay';
import { FormSeparatorLine } from '../components/FormSeparatorLine';

function getEncounterTypeLabel(type) {
  return encounterOptions.find(x => x.value === type).label;
}

function getEncounterLabel(encounter) {
  const encounterDate = DateDisplay.rawFormat(encounter.startDate);
  const encounterTypeLabel = getEncounterTypeLabel(encounter.encounterType);
  return `${encounterDate} (${encounterTypeLabel})`;
}

class DumbImagingRequestForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onMount: PropTypes.func,
  };

  static defaultProps = {
    onMount: null,
  };

  componentDidMount() {
    const { onMount } = this.props;
    if (onMount) onMount();
  }

  renderForm = ({ submitForm }) => {
    const {
      practitionerSuggester,
      imagingTypeSuggester,
      onCancel,
      imagingTypes,
      encounter = {},
    } = this.props;
    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const encounterLabel = getEncounterLabel(encounter);

    return (
      <FormGrid>
        <Field name="id" label="Imaging request code" disabled component={TextField} />
        <Field name="requestedDate" label="Order date" required component={DateField} />
        <TextInput label="Supervising doctor" disabled value={examinerLabel} />
        <Field
          name="requestedById"
          label="Requesting doctor"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <div>
          <Field name="urgent" label="Urgent?" component={CheckField} />
        </div>
        <FormSeparatorLine />
        <TextInput label="Encounter" disabled value={encounterLabel} />
        <Field
          name="imagingTypeId"
          label="Imaging request type"
          required
          component={AutocompleteField}
          suggester={imagingTypeSuggester}
        />
        <Field
          name="areaToBeImaged"
          label="Area to be imaged"
          component={TextField}
          multiline
          style={{ gridColumn: '1 / -1' }}
          rows={3}
        />
        <Field
          name="note"
          label="Notes"
          component={TextField}
          multiline
          style={{ gridColumn: '1 / -1' }}
          rows={3}
        />
        <ButtonRow>
          <Button variant="contained" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitForm} color="primary">
            Finalise and print
          </Button>
          <Button variant="contained" onClick={submitForm} color="primary">
            Finalise and close
          </Button>
        </ButtonRow>
      </FormGrid>
    );
  };

  render() {
    const { onSubmit, editedObject, generateId = shortid.generate } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          id: generateId(),
          requestedDate: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          requestedById: foreignKey('Requesting doctor is required'),
          imagingTypeId: foreignKey('Imaging request type must be selected'),
          requestedDate: yup.date().required(),
        })}
      />
    );
  }
}

export const ImagingRequestForm = connect(
  state => ({
    imagingTypes: getImagingTypes(state).map(({ id, name }) => ({
      value: id,
      label: name,
    })),
  }),
  dispatch => ({
    onMount: () => dispatch(loadOptions()),
  }),
)(DumbImagingRequestForm);
