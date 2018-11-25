import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import moment from 'moment';
import { InputGroup, DatepickerGroup } from '../../../components';
import { VitalModel } from '../../../models';
import { dateTimeFormat } from '../../../constants';

class VisitModal extends Component {
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
    const { action, itemId, isVisible, model: VisitModel } = nextProps;
    let Model;
    if (action === 'edit') {
      Model = VisitModel.get('vitals').findWhere({ _id: itemId });
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
    const { action, model: VisitModel } = this.props;
    const { Model } = this.state;

    try {
      await Model.save();
      if (action === 'new') {
        VisitModel.get('vitals').add(Model);
        await VisitModel.save(null, { silent: true });
      } else {
        VisitModel.trigger('change');
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
      <Modal open={this.state.isVisible} onClose={onClose} little>
        <form
          id="vitalForm"
          name="vitalForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal diagnosis-modal">
            <div className="modal-header">
              <h2>{action === 'new' ? 'Add' : 'Update'} Vitals</h2>
            </div>
            <div className="modal-content">
              <DatepickerGroup
                label="Recorded At"
                name="dateRecorded"
                className="is-5"
                popperModifiers={{
                  offset: {
                    enabled: true,
                    offset: '0px, 30px'
                  }
                }}
                onChange={this.handleUserInput}
                value={form.dateRecorded}
                showTimeSelect
                dateFormat={dateTimeFormat}
                timeIntervals={30}
              />
              <div className="columns p-l-10 p-t-10">
                <InputGroup
                  type="number"
                  label="Temperature (°C)"
                  name="temperature"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.temperature}
                />
                <InputGroup
                  type="number"
                  label="Blood Sugar Level"
                  name="bloodSugarLevel"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.bloodSugarLevel}
                />
              </div>
              <div className="columns p-l-10 p-t-10">
                <InputGroup
                  type="number"
                  label="Weight (kg)"
                  name="weight"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.weight}
                />
                <InputGroup
                  type="number"
                  label="Height (cm)"
                  name="height"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.height}
                />
              </div>
              <div className="columns p-l-10 p-t-10">
                <InputGroup
                  type="number"
                  label="SBP"
                  name="sbp"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.sbp}
                />
                <InputGroup
                  type="number"
                  label="DBP"
                  name="dbp"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.dbp}
                />
              </div>
              <div className="columns p-l-10 p-t-10">
                <InputGroup
                  type="number"
                  label="Heart Rate"
                  name="heartRate"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.heartRate}
                />
                <InputGroup
                  type="number"
                  label="Respiratory Rate"
                  name="respiratoryRate"
                  className="column m-b-0 is-4"
                  inputClass="column is-6 no-padding"
                  onChange={this.handleUserInput}
                  value={form.respiratoryRate}
                />
              </div>
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-default" type="button" onClick={onClose}>Cancel</button>
                {/* <button className={action !== 'new' ? 'button is-danger' : 'button is-danger is-hidden'} type="button" onClick={this.deleteItem}>Delete</button> */}
                <button className="button is-primary" type="submit" form="vitalForm" disabled={!Model.isValid()}>{action === 'new' ? 'Add' : 'Update'}</button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

export default VisitModal;
