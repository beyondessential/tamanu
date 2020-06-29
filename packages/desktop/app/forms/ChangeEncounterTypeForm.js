import React from 'react';

import { Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';

export class ChangeEncounterTypeForm extends React.PureComponent {
  renderForm = ({ submitForm, values }) => {
    const { onCancel, encounter } = this.props;
    const currentType = ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].label;
    const newType = ENCOUNTER_OPTIONS_BY_VALUE[values.encounterType].label;
    return (
      <FormGrid columns={1}>
        <div><span>Changing encounter from </span><b>{currentType}</b><span> to </span><b>{newType}</b></div>
        <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { extraRoute, onSubmit } = this.props;
    return (
      <Form
        initialValues={{
          encounterType: extraRoute,
        }}
        render={this.renderForm}
        onSubmit={onSubmit}
      />
    );
  }
}
