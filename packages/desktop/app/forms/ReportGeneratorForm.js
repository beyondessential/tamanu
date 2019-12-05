import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';

import { Form, Field, DateField } from '../components/Field';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';

import { MultiDiagnosisSelectorField } from '../components/MultiDiagnosisSelector';

export class ReportGeneratorForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { icd10Suggester, onCancel, visit } = this.props;
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
        <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText="Finalise" />
      </FormGrid>
    );
  };

  render() {
    const { onSubmit } = this.props;
    return (
      <div>
        <Form
          onSubmit={onSubmit}
          render={this.renderForm}
        />
      </div>
    );
  }
}
