import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import shortid from 'shortid';
import { connect, useDispatch } from 'react-redux';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';

import { foreignKey } from '../utils/validation';
import { encounterOptions } from '../constants';
import { getImagingTypes, loadOptions } from '../store/options';
import { reloadImagingRequest } from '../store';

import {
  Form,
  Field,
  AutocompleteField,
  TextField,
  CheckField,
  TextInput,
  DateTimeField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { DateDisplay } from '../components/DateDisplay';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { DropdownButton } from '../components/DropdownButton';

function getEncounterTypeLabel(type) {
  return encounterOptions.find(x => x.value === type).label;
}

function getEncounterLabel(encounter) {
  const encounterDate = DateDisplay.rawFormat(encounter.startDate);
  const encounterTypeLabel = getEncounterTypeLabel(encounter.encounterType);
  return `${encounterDate} (${encounterTypeLabel})`;
}

const FormSubmitActionDropdown = React.memo(({ requestId, encounter, submitForm }) => {
  const dispatch = useDispatch();
  const { loadEncounter } = useEncounter();
  const { navigateToImagingRequest } = usePatientNavigation();
  const [awaitingPrintRedirect, setAwaitingPrintRedirect] = useState();

  // Transition to print page as soon as we have the generated id
  useEffect(() => {
    (async () => {
      if (awaitingPrintRedirect && requestId) {
        await dispatch(reloadImagingRequest(requestId));
        navigateToImagingRequest(requestId);
      }
    })();
  }, [requestId, awaitingPrintRedirect, dispatch, navigateToImagingRequest]);

  const finalise = async data => {
    await submitForm(data);
    await loadEncounter(encounter.id);
  };
  const finaliseAndPrint = async data => {
    await submitForm(data);
    // We can't transition pages until the imaging req is fully submitted
    setAwaitingPrintRedirect(true);
  };

  const actions = [
    { label: 'Finalise', onClick: finalise },
    { label: 'Finalise & print', onClick: finaliseAndPrint },
  ];

  return <DropdownButton color="primary" variant="contained" actions={actions} />;
});

class DumbImagingRequestForm extends React.PureComponent {
  componentDidMount() {
    const { onMount } = this.props;
    if (onMount) onMount();
  }

  renderForm = ({ submitForm }) => {
    const {
      practitionerSuggester,
      imagingTypeSuggester,
      onCancel,
      encounter = {},
      requestId,
    } = this.props;
    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const encounterLabel = getEncounterLabel(encounter);

    return (
      <FormGrid>
        <Field name="id" label="Imaging request code" disabled component={TextField} />
        <Field
          name="requestedDate"
          label="Order date and time"
          required
          component={DateTimeField}
        />
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
          <FormSubmitActionDropdown
            requestId={requestId}
            encounter={encounter}
            submitForm={submitForm}
          />
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

DumbImagingRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onMount: PropTypes.func,
};

DumbImagingRequestForm.defaultProps = {
  onMount: null,
};

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
