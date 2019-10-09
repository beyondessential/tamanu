import React from 'react';

import { Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export class ChangeVisitTypeForm extends React.PureComponent {
  
  renderForm = ({ submitForm, values }) => { 
    const { onCancel, visit } = this.props;
    const currentType = visit.visitType;
    return (
      <FormGrid columns={1}>
        <div>{`Changing visit from ${currentType} to type ${values.visitType}`}</div>
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

