import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  AddButton,
  DeleteButton,
  UpdateButton,
  Form,
  Field,
  Modal,
  ModalActions,
  Dialog as DeleteConfirmDialog,
} from '../../../components';
import { PatientModel } from '../../../models';

export default class AllergyModal extends Component {
  state = {
    isDeleteModalVisible: false,
  };

  submitForm = async values => {
    const { patientModel, allergyModel, onClose } = this.props;

    try {
      const isNew = allergyModel.isNew();
      allergyModel.set(values);
      await allergyModel.save();
      if (isNew) {
        patientModel.get('allergies').add(allergyModel);
        await patientModel.save();
      }

      patientModel.trigger('change');
      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  deleteItem = async () => {
    const { patientModel, allergyModel } = this.props;
    try {
      patientModel.get('allergies').remove({ _id: allergyModel.id });
      await patientModel.save();
      await allergyModel.destroy();
      this.deleteModalClose();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  deleteModalClose = () => {
    this.setState({ isDeleteModalVisible: false });
  };

  confirmToDelete = () => {
    this.setState({ isDeleteModalVisible: true });
  };

  render() {
    const { onClose, isVisible, allergyModel } = this.props;
    const { isDeleteModalVisible } = this.state;
    const isNew = allergyModel.isNew();
    return (
      <React.Fragment>
        <Modal
          title={`${isNew ? 'Add' : 'Update'} Allergy`}
          isVisible={isVisible}
          onClose={onClose}
        >
          <Form
            showInlineErrorsOnly
            onSubmit={this.submitForm}
            initialValues={allergyModel.toJSON() || {}}
            validationSchema={allergyModel.validationSchema}
            render={({ isSubmitting, submitForm }) => (
              <React.Fragment>
                <Field component={TextField} name="name" label="Name" required />
                <ModalActions>
                  {isNew ? (
                    <AddButton
                      type="button"
                      disabled={isSubmitting}
                      can={{ do: 'create', on: 'allergy' }}
                      onClick={submitForm}
                    />
                  ) : (
                    <React.Fragment>
                      <DeleteButton
                        can={{ do: 'delete', on: 'allergy' }}
                        onClick={this.confirmToDelete}
                      />
                      <UpdateButton
                        type="button"
                        disabled={isSubmitting}
                        can={{ do: 'update', on: 'allergy' }}
                        onClick={submitForm}
                      />
                    </React.Fragment>
                  )}
                </ModalActions>
              </React.Fragment>
            )}
          />
        </Modal>
        <DeleteConfirmDialog
          dialogType="confirm"
          headerTitle="Delete Allergy?"
          contentText="Are you sure you want to delete this allergy?"
          isVisible={isDeleteModalVisible}
          onConfirm={this.deleteItem}
          onClose={this.deleteModalClose}
        />
      </React.Fragment>
    );
  }
}

AllergyModal.propTypes = {
  patientModel: PropTypes.instanceOf(PatientModel).isRequired,
  allergyModel: PropTypes.instanceOf(Object).isRequired,
  onClose: PropTypes.func,
  isVisible: PropTypes.bool.isRequired,
};

AllergyModal.defaultProps = {
  onClose: () => {},
};
