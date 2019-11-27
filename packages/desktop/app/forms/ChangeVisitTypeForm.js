import React from 'react';

import { Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { VISIT_OPTIONS_BY_VALUE } from '../constants';

export class ChangeVisitTypeForm extends React.PureComponent {
  renderForm = ({ submitForm, values }) => {
    const { onCancel, visit } = this.props;
    const currentType = VISIT_OPTIONS_BY_VALUE[visit.visitType].label;
    const newType = VISIT_OPTIONS_BY_VALUE[values.visitType].label;
    return (
      <FormGrid columns={1}>
        <div><span>Changing visit from </span><b>{currentType}</b><span> to </span><b>{newType}</b></div>
        <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { extraRoute, onSubmit } = this.props;
    return (
      <Form
        initialValues={{
          visitType: extraRoute,
        }}
        render={this.renderForm}
        onSubmit={onSubmit}
      />
    );
  }
}
