import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { clone, pick } from 'lodash';
import InputGroup from '../../../components/InputGroup';
import { DiagnosisModel } from '../../../models';
import CustomDateInput from '../../../components/CustomDateInput';
import { dateFormat } from '../../../constants';

class DiagnosisModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formValid: false,
      isVisible: false,
      form: {}
    };

    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.validateField = this.validateField.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.resetForm = this.resetForm.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { isVisible, action, item } = nextProps;
    if (action === 'edit') {
      const form = pick(item, ['diagnosis', 'date', 'active', 'secondaryDiagnosis']);
      form.date = moment(form.date);
      this.setState({ isVisible, form }, () => this.validateField('diagnosis'));
    } else {
      this.setState({ isVisible }, () => this.resetForm());
    }
  }

  resetForm() {
    const form = {
      diagnosis: '',
      date: moment(),
      active: true,
      secondaryDiagnosis: false,
    };

    this.setState({ form });
  }

  handleUserInput = (e) => {
    const form = clone(this.state.form);
    if (e instanceof moment) {
      form.date = e;
      this.setState({ form }, () => { this.validateField('date'); });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      form[name] = value;
      this.setState({ form }, () => { this.validateField(name); });
    }
  }

  validateField = (name) => {
    let valid = true;
    if (this.state.form[name] === '') valid = false;
    this.setState({ formValid: valid });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, item, model: patientModel } = this.props;
    const _this = this;
    const { form } = this.state;

    try {
      const allergy = new DiagnosisModel((action !== 'new' ? item : form));
      if (action !== 'new') allergy.set(form);
      const model = await allergy.save();

      // Attached allergy to patient object
      if (action === 'new') {
        patientModel.get('diagnoses').add({ _id: model.id });
        await patientModel.save();
      } else {
        patientModel.trigger('change');
      }

      _this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  async deleteItem() {
    const { item, model: patientModel } = this.props;
    const allergy = new DiagnosisModel(item);

    try {
      patientModel.get('diagnoses').remove({ _id: allergy.id });
      await patientModel.save();
      await allergy.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const { onClose, action } = this.props;
    return (
      <Modal open={this.state.isVisible} onClose={onClose} little>
        <form
          name="allergyForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal diagnosis-modal">
            <div className="modal-header">
              <h2>{action === 'new' ? 'Add' : 'Update'} Diagnosis</h2>
            </div>
            <div className="modal-content">
              <InputGroup
                name="diagnosis"
                label="Diagnosis"
                value={this.state.form.diagnosis}
                onChange={this.handleUserInput}
                required
              />
              <div className="column is-one-third">
                <span className="header">
                  Date
                </span>
                <DatePicker
                  name="date"
                  autoFocus
                  customInput={<CustomDateInput />}
                  selected={this.state.form.date}
                  onChange={this.handleUserInput}
                  dateFormat={dateFormat}
                  peekNextMonth
                  // value={moment(birthday).format('YYYY-MM-DD')}
                  type="button"
                  popperModifiers={{
                    offset: {
                      enabled: true,
                      offset: '-10px, 0px'
                    }
                  }}
                />
              </div>
              <div className="column is-half is-pulled-left">
                <label className="checkbox">
                  <input type="checkbox" name="secondaryDiagnosis" checked={this.state.form.secondaryDiagnosis} onChange={this.handleUserInput} /> Secondary Diagnosis
                </label>
              </div>
              <div className={`column is-half is-pulled-right ${action === 'new' ? 'is-hidden' : ''}`}>
                <label className="checkbox">
                  <input type="checkbox" name="active" checked={this.state.form.active} onChange={this.handleUserInput} /> Active Diagnosis
                </label>
              </div>
              <div className="is-clearfix" />
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-default" type="button" onClick={onClose}>Cancel</button>
                <button className={action !== 'new' ? 'button is-danger' : 'button is-danger is-hidden'} type="button" onClick={this.deleteItem}>Delete</button>
                <button className="button is-primary" type="submit" disabled={!this.state.formValid}>{action === 'new' ? 'Add' : 'Update'}</button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

export default DiagnosisModal;
