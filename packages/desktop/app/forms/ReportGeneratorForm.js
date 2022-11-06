import React from 'react';

import { Form, Field, DateField } from '../components/Field';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';

import { MultiDiagnosisSelectorField } from '../components/MultiDiagnosisSelector';

export class ReportGeneratorForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { icd10Suggester, onCancel } = this.props;
    return (
      <FormGrid columns={2}>
        <Field name="startDate" label="Start date" component={DateField} />
        <Field name="endDate" label="End date" component={DateField} />
        <Field
          name="diagnoses"
          label="Diagnoses"
          component={MultiDiagnosisSelectorField}
          icd10Suggester={icd10Suggester}
        />
        <ConfirmCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText="Generate report"
        />
      </FormGrid>
    );
  };

  render() {
    const { onSubmit } = this.props;
    return (
      <div>
        <Form onSubmit={onSubmit} render={this.renderForm} />
      </div>
    );
  }
}
