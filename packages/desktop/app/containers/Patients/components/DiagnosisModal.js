import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  AddButton, CancelButton,
  DeleteButton, UpdateButton, CheckField, SelectField,
  DateField, Dialog as ConditionConfirmDialog, FormRow,
  ModalActions, Modal, Form, Field,
} from '../../../components';
import { AutocompleteField } from '../../../components/CommonAutocomplete';
import { diagnosisCertainty } from '../../../constants';
import { ConditionModel, PatientModel } from '../../../models';
import { notifyError, notifySuccess } from '../../../utils';

async function fetchDiagnoses(search) {
  const result = await fetch(`http://localhost:4000/values/icd10?q=${search}`);
  const data = await result.json();
  return data.map(({ name, code, _id }) => ({
    value: _id,
    label: `[${code}] ${name}`
  }));
}

export default class DiagnosisModal extends Component {
  state = {
    isConditionModalVisible: false,
  }

  submitForm = async values => {
    const { patientDiagnosisModel, parentModel, onClose } = this.props;
    const isNew = patientDiagnosisModel.isNew();

    try {
      patientDiagnosisModel.set(values);
      await patientDiagnosisModel.save();
      if (isNew) {
        parentModel.get('diagnoses').add(patientDiagnosisModel);
        await parentModel.save();
      } else {
        parentModel.trigger('change');
      }

      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  makeOngoingCondition = async () => {
    const { parentModel, patientModel } = this.props;
    this.closeConditionModal();
    if (parentModel.id) {
      const { date, diagnosis: condition } = parentModel.toJSON();
      const conditionModel = new ConditionModel({ date, condition });
      await conditionModel.save();
      // attach to patient
      patientModel.get('conditions').add(conditionModel);
      await patientModel.save();
      // link to current diagnosis object
      parentModel.set({ condition: conditionModel });
      await parentModel.save();
      notifySuccess('Diagnosis was marked as an ongoing condition successfully.');
      this.forceUpdate(); // re-render
    } else {
      notifyError('Invalid request');
    }
  }

  closeConditionModal = () => {
    this.setState({ isConditionModalVisible: false });
  }

  deleteItem = async () => {
    const { itemId: _id, patientDiagnosisModel, parentModel } = this.props;
    try {
      parentModel.get('diagnoses').remove({ _id });
      await parentModel.save();
      await patientDiagnosisModel.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  openConditionModal() {
    this.setState({ isConditionModalVisible: true });
  }

  render() {
    const {
      onClose,
      isVisible,
      patientDiagnosisModel,
    } = this.props;
    const { isConditionModalVisible } = this.state;
    const isNew = patientDiagnosisModel.isNew();

    return (
      <React.Fragment>
        <Modal
          title={`${isNew ? 'Add' : 'Update'} Diagnosis`}
          isVisible={isVisible}
          onClose={onClose}
        >
          <Form
            showInlineErrorsOnly
            onSubmit={this.submitForm}
            initialValues={patientDiagnosisModel.toJSON()}
            validationSchema={patientDiagnosisModel.validationSchema}
            render={({ submitForm, isSubmitting }) => (
              <React.Fragment>
                <FormRow>
                  <Field
                    component={AutocompleteField}
                    label="Diagnosis"
                    name="diagnosis._id"
                    fetchOptions={fetchDiagnoses}
                    required
                  />
                </FormRow>
                <FormRow>
                  <Field
                    component={DateField}
                    label="Date"
                    name="date"
                  />
                  <Field
                    component={SelectField}
                    label="Certainty"
                    name="certainty"
                    options={diagnosisCertainty}
                  />
                </FormRow>
                <FormRow>
                  <Field
                    component={CheckField}
                    label="Secondary Diagnosis"
                    name="secondaryDiagnosis"
                  />
                </FormRow>
                <ModalActions>
                  <CancelButton onClick={onClose} />
                  {isNew
                    ? (
                      <AddButton
                        type="button"
                        onClick={submitForm}
                        disabled={isSubmitting}
                        can={{ do: 'create', on: 'diagnosis' }}
                      />
                    )
                    : (
                      <React.Fragment>
                        <DeleteButton
                          can={{ do: 'delete', on: 'diagnosis' }}
                          onClick={this.deleteItem}
                        />
                        <UpdateButton
                          type="button"
                          onClick={submitForm}
                          disabled={isSubmitting}
                          can={{ do: 'update', on: 'diagnosis' }}
                        />
                      </React.Fragment>
                    )
                  }
                </ModalActions>
              </React.Fragment>
            )}
          />
        </Modal>
        <ConditionConfirmDialog
          dialogType="confirm"
          headerTitle="Mark as ongoing condition?"
          contentText="Are you sure you want to mark this diagnosis as an ongoing condition?"
          isVisible={isConditionModalVisible}
          onConfirm={this.makeOngoingCondition}
          onClose={this.closeConditionModal}
        />
      </React.Fragment>
    );
  }
}

DiagnosisModal.propTypes = {
  patientDiagnosisModel: PropTypes.instanceOf(Object).isRequired,
  parentModel: PropTypes.instanceOf(Object).isRequired,
  patientModel: PropTypes.instanceOf(Object),
  onClose: PropTypes.func.isRequired,
};

DiagnosisModal.defaultProps = {
  patientModel: new PatientModel(),
};
