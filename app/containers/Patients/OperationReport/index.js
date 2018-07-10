import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import Select from 'react-select';
import { clone, isUndefined, each, has, capitalize } from 'lodash';

// import Serializer from '../../../utils/form-serialize';
import Allergy from './Allergy';
import Diagnosis from './Diagnosis';
import Procedure from './Procedure';
import ModalView from '../../../components/Modal';
import InputGroup from '../../../components/InputGroup';
import TextareaGroup from '../../../components/TextareaGroup';

// import Serializer from '../../../utils/form-serialize';
import { PatientModel, OperationReportModel, DiagnosisModel } from '../../../models';
import { getDifferenceDate, operativePlanStatusList } from '../../../constants';

class OperationReport extends Component {
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
    this.setForm = this.setForm.bind(this);
  }

  state = {
    formError: false,
    formSuccess: false,
    patient: this.props.patient.attributes,
    preOpDiagnoses: this.props.operationReport.attributes.preOpDiagnoses,
    action: 'update',
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
    let _action = 'new';
    this.props.patient.on('change', this.handleChange);
    this.props.patient.set({ _id: patientId });
    await this.props.patient.fetch();

    if (!isUndefined(id)) {
      _action = 'update';
      this.props.operationReport.on('change', this.handleChange);
      this.props.operationReport.set({ _id: id });
      await this.props.operationReport.fetch();
    }

    this.setForm(_action);
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

    this.setState({ form });
  }

  setForm = (_action) => {
    const data = this.props.operationReport.toJSON();
    const preOpDiagnoses = (_action === 'new' ? this.props.patient.get('preOpDiagnoses') : this.props.operationReport.get('preOpDiagnoses'));
    const form = clone(this.state.form);
    each(form, (value, key) => { form[key] = (has(data, key) ? data[key] : value); });
    this.setState({ form, action: _action, preOpDiagnoses: preOpDiagnoses.models });
  }

  goBack() {
    this.props.history.push(`/patients/editPatient/${this.state.patient._id}`);
  }

  onCloseErrorModal = () => {
    this.setState({ formError: false });
  }

  onCloseSuccessModal = () => {
    this.setState({ formSuccess: false });
  }

  markComplete = (e) => {
    e.preventDefault();
    const form = clone(this.state.form);
    form.status = 'completed';
    this.setState({ form }, async () => {
      await this.submitForm(e);
    });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { patient, operationReport } = this.props;
    const { form, action } = this.state;
    if (!this.state.form.procedures.length) return this.setState({ formError: true });

    try {
      // const operativePlan = new OperationReportModel();
      operationReport.set(form);
      const model = await operationReport.save();

      // Attached operativePlan to patient object
      if (action === 'new') {
        // Duplicate diagnostics to operation plan
        const preOpDiagnoses = patient.get('preOpDiagnoses');
        if (preOpDiagnoses.length > 0) {
          const tasks = [];
          each(preOpDiagnoses.models, (diagnosis) => {
            const attributes = diagnosis.cloneAttributes();

            const _model = new DiagnosisModel();
            _model.set(attributes);
            tasks.push(_model.save());
          });

          const resp = await Promise.all(tasks);
          resp.forEach((m) => {
            operationReport.get('preOpDiagnoses').add({ _id: m.id });
          });

          await operationReport.save();
        }

        patient.get('operativePlans').add({ _id: model.id });
        await patient.save();
        this.props.history.replace(`/patients/operativePlan/${patient.id}/${model.id}`);
        this.setState({ action: 'update' });
      } else {
        patient.trigger('change');
      }

      this.setState({ formSuccess: true });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const {
      patient,
      formError,
      formSuccess,
      form,
      action,
      preOpDiagnoses
    } = this.state;

    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>Edit Operation Report</span>
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
                      <Diagnosis diagnoses={preOpDiagnoses} model={this.props.patient} readonly />
                      <Diagnosis diagnoses={preOpDiagnoses} model={this.props.patient} showSecondary readonly />
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
              <Procedure procedures={form.procedures} onChange={this.handleUserInput} />
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
                    <button className="button is-danger m-r-5" onClick={this.goBack}>Cancel</button>
                    <button className="button is-primary m-r-5" onClick={this.submitForm}>Update</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <ModalView
          isVisible={formError}
          onClose={this.onCloseErrorModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        />
        <ModalView
          isVisible={formSuccess}
          onClose={this.onCloseSuccessModal}
          headerTitle="Success!"
          contentText="Operative Plan was successfully saved!"
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
  operationReport: new OperationReportModel()
});

export default connect(undefined, mapDispatchToProps)(OperationReport);
