import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import {
  TextField, AddButton, CancelButton, Field,
  DeleteButton, UpdateButton, DateField, Form,
  Dialog as DeleteConfirmDialog, Modal, ModalActions,
} from '../../../components';
import { ConditionModel, PatientModel } from '../../../models';

export default class ConditionModal extends Component {
  static propTypes = {
    conditionModel: PropTypes.instanceOf(ConditionModel).isRequired,
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
    onClose: PropTypes.func,
    isVisible: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    onClose: () => {},
  }

  constructor(props) {
    super(props);
    const { conditionModel: { attributes } } = this.props;
    this.state = {
      ...attributes,
      deleteModalVisible: false,
    };
  }

  submitForm = async values => {
    const { conditionModel, patientModel, onClose } = this.props;
    const isNew = conditionModel.isNew();

    try {
      conditionModel.set(values);
      await conditionModel.save();
      if (isNew) {
        patientModel.get('conditions').add(conditionModel);
        await patientModel.save();
      } else {
        patientModel.trigger('change');
      }

      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  deleteItem = async () => {
    const {
      itemId: _id,
      conditionModel,
      patientModel,
    } = this.props;

    try {
      this.deleteModalClose();
      patientModel.get('conditions').remove({ _id });
      await patientModel.save();
      await conditionModel.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  deleteModalClose = () => {
    this.setState({ deleteModalVisible: false });
  }

  deleteItemConfirm = () => {
    this.setState({ deleteModalVisible: true });
  }

  render() {
    const { deleteModalVisible } = this.state;
    const {
      onClose,
      isVisible,
      conditionModel,
    } = this.props;

    return (
      <React.Fragment>
        <Modal
          title={`${conditionModel.isNew() ? 'Add' : 'Update'} Condition`}
          isVisible={isVisible}
          onClose={onClose}
        >
          <Form
            showInlineErrorsOnly
            onSubmit={this.submitForm}
            initialValues={conditionModel.toJSON()}
            validationSchema={conditionModel.validationSchema}
            render={({ isSubmitting, submitForm }) => (
              <React.Fragment>
                <Grid container spacing={16} direction="row">
                  <Grid container item>
                    <Field
                      component={TextField}
                      name="condition"
                      label="Condition"
                      autoFocus
                      required
                    />
                  </Grid>
                  <Grid container item>
                    <Field
                      component={DateField}
                      label="Date of Diagnosis"
                      name="date"
                      required
                    />
                  </Grid>
                </Grid>
                <ModalActions>
                  {conditionModel.isNew()
                    ? (
                      <React.Fragment>
                        <CancelButton onClick={onClose} />
                        <AddButton
                          type="button"
                          onClick={submitForm}
                          disabled={isSubmitting}
                          can={{ do: 'create', on: 'condition' }}
                        />
                      </React.Fragment>
                    )
                    : (
                      <React.Fragment>
                        <DeleteButton
                          can={{ do: 'delete', on: 'condition' }}
                          onClick={this.deleteItemConfirm}
                        />
                        <UpdateButton
                          type="button"
                          onClick={submitForm}
                          disabled={isSubmitting}
                          can={{ do: 'update', on: 'condition' }}
                        />
                      </React.Fragment>
                    )
                  }
                </ModalActions>
              </React.Fragment>
            )}
          />
        </Modal>

        <DeleteConfirmDialog
          dialogType="confirm"
          headerTitle="Delete Ongoing Condition?"
          contentText="Are you sure you want to delete this ongoing condition?"
          isVisible={deleteModalVisible}
          onConfirm={this.deleteItem}
          onClose={this.deleteModalClose}
        />
      </React.Fragment>
    );
  }
}
