import React, { Component } from 'react';
import moment from 'moment';
import {
  TextInput, DateInput, AddButton, ModalActions,
  UpdateButton, CancelButton, FormRow, Modal,
} from '../../../components';
import { VitalModel } from '../../../models';
import { dateTimeFormat } from '../../../constants';

export default class VisitModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      Model: new VitalModel(),
    };

    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const {
      action, itemId, isVisible, visitModel,
    } = nextProps;
    let Model;
    if (action === 'edit') {
      Model = visitModel.get('vitals').findWhere({ _id: itemId });
      if (Model.get('dateRecorded') !== '') Model.set('dateRecorded', moment(Model.get('dateRecorded')));
    } else {
      Model = new VitalModel();
    }
    this.setState({ isVisible, Model });
  }

  handleUserInput = (e, field) => {
    const { Model } = this.state;
    if (typeof field !== 'undefined') {
      Model.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      Model.set(name, value, { silent: true });
    }
    this.setState({ Model });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, visitModel } = this.props;
    const { Model } = this.state;

    try {
      await Model.save();
      if (action === 'new') {
        visitModel.get('vitals').add(Model);
        await visitModel.save();
      } else {
        visitModel.trigger('change');
      }
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const { onClose, action } = this.props;
    const { Model } = this.state;
    const form = Model.toJSON();
    return (
      <Modal
        title={`${action === 'new' ? 'Add' : 'Update'} Vitals`}
        isVisible={this.state.isVisible}
        onClose={onClose}
      >
        <form
          id="vitalForm"
          name="vitalForm"
          onSubmit={this.submitForm}
        >
          <FormRow>
            <DateInput
              label="Recorded At"
              name="dateRecorded"
              popperModifiers={{
                offset: {
                  enabled: true,
                  offset: '0px, 30px',
                },
              }}
              onChange={this.handleUserInput}
              value={form.dateRecorded}
              showTimeSelect
              dateFormat={dateTimeFormat}
              timeIntervals={30}
            />
          </FormRow>
          <FormRow>
            <TextInput
              type="number"
              label="Temperature (°C)"
              name="temperature"
              onChange={this.handleUserInput}
              value={form.temperature}
            />
            <TextInput
              type="number"
              label="Blood Sugar Level (mmol/L)"
              name="bloodSugarLevel"
              onChange={this.handleUserInput}
              value={form.bloodSugarLevel}
            />
          </FormRow>
          <FormRow>
            <TextInput
              type="number"
              label="Weight (kg)"
              name="weight"
              onChange={this.handleUserInput}
              value={form.weight}
            />
            <TextInput
              type="number"
              label="Height (cm)"
              name="height"
              onChange={this.handleUserInput}
              value={form.height}
            />
          </FormRow>
          <FormRow>
            <TextInput
              type="number"
              label="SBP"
              name="sbp"
              onChange={this.handleUserInput}
              value={form.sbp}
            />
            <TextInput
              type="number"
              label="DBP"
              name="dbp"
              onChange={this.handleUserInput}
              value={form.dbp}
            />
          </FormRow>
          <FormRow>
            <TextInput
              type="number"
              label="Heart Rate"
              name="heartRate"
              onChange={this.handleUserInput}
              value={form.heartRate}
            />
            <TextInput
              type="number"
              label="Respiratory Rate"
              name="respiratoryRate"
              onChange={this.handleUserInput}
              value={form.respiratoryRate}
            />
          </FormRow>
          <ModalActions>
            <CancelButton
              onClick={onClose}
            />
            {action === 'new'
              && (
                <AddButton
                  type="submit"
                  form="vitalForm"
                  can={{ do: 'create', on: 'vital' }}
                  disabled={!Model.isValid()}
                />
              )
            }
            {action !== 'new'
              && (
                <UpdateButton
                  type="submit"
                  form="vitalForm"
                  can={{ do: 'update', on: 'vital' }}
                  disabled={!Model.isValid()}
                />
              )
            }
          </ModalActions>
        </form>
      </Modal>
    );
  }
}
