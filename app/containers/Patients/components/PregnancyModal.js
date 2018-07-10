import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { clone, pick } from 'lodash';
import Select from 'react-select';
import InputGroup from '../../../components/InputGroup';
import { PregnancyModel } from '../../../models';
import CustomDateInput from '../../../components/CustomDateInput';
import PatientAutocomplete from '../../../components/PatientAutocomplete';
import { dateFormat, pregnancyOutcomes } from '../../../constants';

class PregnancyModal extends Component {
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
      conceiveDate: moment(),
      deliveryDate: moment(),
      // deliveryDate: '',
      outcome: '',
      child: '',
      father: '',
      gestationalAge: '',
    };

    this.setState({ form });
  }

  handleUserInput = (e, name) => {
    const form = clone(this.state.form);
    if (typeof name !== 'undefined') {
      form[name] = e;
      this.setState({ form }, () => { this.validateField(name); });
    } else {
      const { name: _name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      form[_name] = value;
      this.setState({ form }, () => { this.validateField(_name); });
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
      const pregnancy = new PregnancyModel((action !== 'new' ? item : form));
      if (action !== 'new') pregnancy.set(form);
      const model = await pregnancy.save();

      // Attached pregnancy to patient object
      if (action === 'new') {
        patientModel.get('pregnancies').add({ _id: model.id });
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
    const pregnancy = new PregnancyModel(item);

    try {
      patientModel.get('pregnancies').remove({ _id: pregnancy.id });
      await patientModel.save();
      await pregnancy.destroy();
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
          name="pregnancyForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal diagnosis-modal">
            <div className="modal-header">
              <h2>{action === 'new' ? 'Add' : 'Update'} Pregnancy</h2>
            </div>
            <div className="modal-content">
              <div className="column is-half">
                <span className="header">
                  Estimated Conception Date
                </span>
                <DatePicker
                  name="conceiveDate"
                  className="input custom-date-input column is-three-fifths"
                  selected={this.state.form.conceiveDate}
                  onChange={(date) => { this.handleUserInput(date, 'conceiveDate'); }}
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
              <div className="column is-four-fifths">
                <span className="header">Outcome</span>
                <Select
                  id="pregnancy-outcome"
                  options={pregnancyOutcomes}
                  simpleValue
                  name="outcome"
                  value={this.state.form.outcome}
                  onChange={(val) => { console.log('-val-', val); this.handleUserInput(val, 'outcome'); }}
                  searchable={false}
                />
              </div>
              <div className={`column is-half ${this.state.form.outcome === '' ? 'is-hidden' : ''}`}>
                <span className="header">
                  Delivery Date
                </span>
                <DatePicker
                  name="deliveryDate"
                  className="input custom-date-input column is-three-fifths"
                  selected={this.state.form.deliveryDate}
                  onChange={(date) => { this.handleUserInput(date, 'deliveryDate'); }}
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
              <PatientAutocomplete
                name="child"
                label="Child"
                value={this.state.form.child}
                onChange={this.handleUserInput}
                className={`is-four-fifths ${this.state.form.outcome === '' ? 'is-hidden' : ''}`}
              />
              <PatientAutocomplete
                name="father"
                label="Father"
                value={this.state.form.father}
                onChange={this.handleUserInput}
                className={`is-four-fifths ${this.state.form.outcome === '' ? 'is-hidden' : ''}`}
              />
              <InputGroup
                name="gestationalAge"
                label="Gestational Age"
                value={this.state.form.gestationalAge}
                onChange={this.handleUserInput}
                className={`is-one-third ${this.state.form.outcome !== 'fetalDeath' ? 'is-hidden' : ''}`}
              />
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

export default PregnancyModal;
