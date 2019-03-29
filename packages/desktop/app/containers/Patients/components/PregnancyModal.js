import React, { Component } from 'react';
import moment from 'moment';
import { pick } from 'lodash';
import { Grid } from '@material-ui/core';
import {
  TextInput, Modal, DateInput, SelectInput, ModalActions,
  CancelButton, AddButton, UpdateButton,
} from '../../../components';
import { PregnancyModel } from '../../../models';
import PatientAutocomplete from '../../../components/PatientAutocomplete';
import { pregnancyOutcomes, MUI_SPACING_UNIT as spacing } from '../../../constants';

export default class PregnancyModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFormValid: false,
      isVisible: false,
      form: {},
    };
  }

  componentWillReceiveProps(nextProps) {
    const { isVisible, action, item } = nextProps;
    if (action === 'edit') {
      const form = pick(item.attributes, ['conceiveDate', 'deliveryDate', 'outcome', 'child', 'father', 'gestationalAge']);
      if (form.conceiveDate !== '') form.conceiveDate = moment(form.conceiveDate);
      if (form.deliveryDate !== '') form.deliveryDate = moment(form.deliveryDate);
      if (typeof form.child === 'object') form.child = form.child.get('_id');
      if (typeof form.father === 'object') form.father = form.father.get('_id');

      this.setState({ isVisible, form }, () => this.validateField());
    } else {
      this.setState({ isVisible }, () => this.resetForm());
    }
  }

  handleAutoCompleteInput = (value, name) => {
    this.handleFormInput(value, name);
  }

  handleUserInput = ({ target }) => {
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.handleFormInput(value, name);
  }

  handleFormInput = (value, name) => {
    const { form } = this.state;
    form[name] = value;
    this.setState({ form }, () => this.validateField());
  }

  validateField = () => {
    const { form } = this.state;
    let valid = true;
    if (form.conceiveDate && form.conceiveDate === '') valid = false;
    this.setState({ isFormValid: valid });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, item, patientModel } = this.props;
    const _this = this;
    const { form } = this.state;

    try {
      if (action === 'new') {
        const pregnancyModel = new PregnancyModel(form);
        await pregnancyModel.save();
        patientModel.get('pregnancies').add(pregnancyModel);
        await patientModel.save();
      } else {
        item.set(form);
        await item.save();
      }

      _this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  deleteItem = async () => {
    const { item, patientModel } = this.props;
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

  resetForm = () => {
    this.setState({ form: {} });
  }

  // filterModels
  render() {
    const { onClose, action, patientModel } = this.props;
    const { isFormValid, form } = this.state;
    return (
      <Modal
        title={`${action === 'new' ? 'Add' : 'Update'} Pregnancy`}
        isVisible={this.state.isVisible}
        onClose={onClose}
      >
        <form
          name="pregnancyForm"
          onSubmit={this.submitForm}
        >
          <Grid container spacing={spacing * 2}>
            <Grid item xs={12}>
              <DateInput
                label="Estimated Conception Date"
                name="conceiveDate"
                value={form.conceiveDate}
                onChange={this.handleUserInput}
              />
            </Grid>
            <Grid item xs={12}>
              <SelectInput
                label="Outcome"
                options={pregnancyOutcomes}
                name="outcome"
                value={form.outcome}
                onChange={this.handleUserInput}
              />
            </Grid>
            <Grid item xs={12}>
              <DateInput
                label="Delivery Date"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={(date) => { this.handleUserInput(date, 'deliveryDate'); }}
              />
            </Grid>
            {form.outcome
              && form.outcome !== 'fetalDeath'
              && (
                <Grid item xs={12}>
                  <PatientAutocomplete
                    name="child"
                    label="Child"
                    value={form.child}
                    onChange={this.handleAutoCompleteInput}
                    filterModels={(patient) => patient._id !== patientModel.get('_id')}
                  />
                </Grid>
              )
            }
            {form.outcome
              && (
                <Grid item xs={12}>
                  <PatientAutocomplete
                    name="father"
                    label="Father"
                    value={form.father}
                    onChange={this.handleAutoCompleteInput}
                    filterModels={(patient) => patient._id !== patientModel.get('_id')}
                  />
                </Grid>
              )
            }
            <Grid item xs={12}>
              <TextInput
                name="gestationalAge"
                label="Gestational Age"
                value={form.gestationalAge}
                onChange={this.handleUserInput}
                className={`is-one-third ${form.outcome !== 'fetalDeath' ? 'is-hidden' : ''}`}
              />
            </Grid>
          </Grid>
          <ModalActions>
            <CancelButton onClick={onClose} />
            {action === 'new'
              ? (
                <AddButton
                  type="submit"
                  disabled={!isFormValid}
                />
              )
              : (
                <UpdateButton
                  type="submit"
                  disabled={!isFormValid}
                />
              )
            }
          </ModalActions>
        </form>
      </Modal>
    );
  }
}

PregnancyModal.defaultProps = {
  form: {
    conceiveDate: moment(),
    deliveryDate: moment(),
    // deliveryDate: '',
    outcome: '',
    child: '',
    father: '',
    gestationalAge: '',
  },
};
