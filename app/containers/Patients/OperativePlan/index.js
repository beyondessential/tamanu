import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import Select from 'react-select';
import { clone, isUndefined, each, has } from 'lodash';

// import Serializer from '../../../utils/form-serialize';
import Allergy from './Allergy';
import Dignosis from './Dignosis';
import Procedure from './Procedure';
import ModalView from '../../../components/Modal';
import InputGroup from '../../../components/InputGroup';
import TextareaGroup from '../../../components/TextareaGroup';

// import Serializer from '../../../utils/form-serialize';
import { PatientModel, OperativePlanModel } from '../../../models';
import { getDifferenceDate, operativePlanStatusList } from '../../../constants';

class OperativePlan extends Component {
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
    this.setForm = this.setForm.bind(this);
  }

  state = {
    formError: false,
    patient: this.props.patient.attributes,
    operationReport: this.props.operationReport.attributes,
    action: 'new',
    form: {
      additionalNotes: '',
      admissionInstructions: '',
      caseComplexity: '',
      operationDescription: '',
      procedures: [],
      status: 'planned',
      surgeon: '',
    }
  }

  async componentDidMount() {
    const { patientId, id } = this.props.match.params;
    this.props.patient.on('change', this.handleChange);
    this.props.patient.set({ _id: patientId });
    await this.props.patient.fetch();

    if (!isUndefined(id)) {
      this.props.operationReport.on('change', this.handleChange);
      this.props.operationReport.set({ _id: id });
      await this.props.operationReport.fetch();
      this.setForm(this.props.operationReport.toJSON());
    }
  }

  componentWillUnmount() {
    this.props.patient.off('change', this.handleChange);
    this.props.operationReport.off('change', this.handleChange);
  }

  handleChange = async () => {
    try {
      const patient = await this.props.patient.toJSON({ relations: true });
      if (patient.dateOfBirth !== '') patient.age = getDifferenceDate(moment(), moment(patient.dateOfBirth));
      this.setState({ patient }, () => this.forceUpdate());
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  handleUserInput = (e, field) => {
    const form = clone(this.state.form);
    if (typeof field !== 'undefined') {
      form[field] = e;
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      form[name] = value;
    }

    this.setState({ form }, () => {
      console.log('form', this.state.form);
    });
  }

  setForm = (data) => {
    const form = clone(this.state.form);
    each(form, (value, key) => { form[key] = (has(data, key) ? data[key] : value); });
    this.setState({ form, action: 'update' });
  }

  goBack() {
    this.props.history.push(`/patients/editPatient/${this.state.patient._id}`);
  }

  onCloseModal = () => {
    this.setState({ formError: false });
  }

  submitForm = async (e) => {
    e.preventDefault();
    console.log('submitForm');
    const { item, patient } = this.props;
    const _this = this;
    const { form, action } = this.state;
    console.log('here1', form);

    if (!this.state.form.procedures.length) return this.setState({ formError: true });

    try {
      const operativePlan = new OperativePlanModel((action !== 'new' ? item : form));
      if (action !== 'new') operativePlan.set(form);
      const model = await operativePlan.save();
      console.log('here2', model);

      // Attached operativePlan to patient object
      if (action === 'new') {
        patient.get('operativePlans').add({ _id: model.id });
        await patient.save();
        console.log('here3', patient);

        const url = `/patients/operativePlan/${patient.id}/${model.id}`;
        console.log('url', url);
        this.props.history.replace(url);
        this.setState({ action: 'update' });
      } else {
        patient.trigger('change');
      }

      _this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const {
      patient,
      formError,
      form,
      action
    } = this.state;

    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
               New Operative Plan
            </span>
          </div>
          <form
            name="opPlanForm"
            className="create-container"
            onSubmit={this.submitForm}
          >
            <div className="form">
              <div className="columns">
                <div className="column">
                  <div className="columns is-multiline is-variable m-b-0">
                    <div className="column is-8">
                      <div className="column p-b-5">
                        <span className="title">Name: </span>
                        <span className="full-name">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                      <div className="column p-b-5 p-t-5">
                        <span className="title is-medium">Sex: </span>
                        <span className="is-medium">
                          {patient.sex}
                        </span>
                      </div>
                      <div className="column p-t-5 p-b-5">
                        <span className="title is-medium">Age: </span>
                        <span className="is-medium">
                          {patient.age}
                        </span>
                      </div>
                    </div>
                    <div className="column is-4">
                      <div className="align-left">
                        <div className="card-info">
                          {patient.displayId}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="columns border-bottom">
                    <div className="column">
                      <Dignosis patient={patient} model={this.props.patient} showSecondary readonly />
                    </div>
                    <div className="column">
                      <Allergy patient={patient} model={this.props.patient} readonly />
                    </div>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="operationDescription"
                    label="Operation Description"
                    tabIndex={1}
                    onChange={this.handleUserInput}
                    value={form.operationDescription}
                  />
                </div>
              </div>
              <Procedure onChange={this.handleUserInput} />
              <div className="columns">
                <div className="column is-10">
                  <div className="columns">
                    <div className="column">
                      <InputGroup
                        name="surgeon"
                        label="Surgeon"
                        tabIndex={4}
                        onChange={this.handleUserInput}
                        value={form.surgeon}
                      />
                    </div>
                    <div className="column">
                      <div className="column">
                        <span className="header">
                          Status
                        </span>
                        <Select
                          id="state-select"
                          onBlurResetsInput={false}
                          onSelectResetsInput={false}
                          clearable={false}
                          options={operativePlanStatusList}
                          placeholder="Status"
                          simpleValue
                          name="status"
                          disabled={this.state.disabled}
                          value={form.status}
                          onChange={(value) => { this.handleUserInput(value, 'status'); }}
                        />
                      </div>
                    </div>
                    <div className="column">
                      <InputGroup
                        name="caseComplexity"
                        label="Case Complexity"
                        tabIndex={9}
                        onChange={this.handleUserInput}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="admissionInstructions"
                    label="Instructions Upon Admission"
                    tabIndex={1}
                    onChange={this.handleUserInput}
                    value={form.admissionInstructions}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="additionalNotes"
                    label="Additional Notes"
                    tabIndex={1}
                    onChange={this.handleUserInput}
                    value={form.additionalNotes}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="column has-text-right">
                    <button className="button is-danger cancel" onClick={this.goBack}>Cancel</button>
                    <button className="button is-primary" onClick={this.submitForm}>{action === 'new' ? 'Add' : 'Update'}</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        />
      </div>
    );
  }
}

// function mapStateToProps(state) {
//   const { onePatient, updatedBirthday, updatedReferredDate } = state.patients;
//   return {
//     patient: onePatient,
//     updatedBirthday,
//     updatedReferredDate
//   };
// }

const mapDispatchToProps = () => ({
  patient: new PatientModel(),
  operationReport: new OperativePlanModel()
});

export default connect(undefined, mapDispatchToProps)(OperativePlan);
