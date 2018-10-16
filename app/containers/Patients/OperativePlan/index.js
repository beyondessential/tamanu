import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import Select from 'react-select';
import { clone, isUndefined, each, has, capitalize, pick } from 'lodash';

// import Serializer from '../../../utils/form-serialize';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import Procedure from '../components/Procedure';
import ModalView from '../../../components/Modal';
import InputGroup from '../../../components/InputGroup';
import TextareaGroup from '../../../components/TextareaGroup';

// import Serializer from '../../../utils/form-serialize';
import { PatientModel, OperativePlanModel, DiagnosisModel, OperationReportModel } from '../../../models';
import { getDifferenceDate, operativePlanStatusList, dateFormat } from '../../../constants';

class OperativePlan extends Component {
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
    this.onCloseCompletedModal = this.onCloseCompletedModal.bind(this);
    this.setForm = this.setForm.bind(this);
  }

  state = {
    formError: false,
    formSuccess: false,
    markedCompleted: false,
    patient: this.props.patient.attributes,
    diagnoses: this.props.patient.attributes.diagnoses,
    action: 'new',
    opReportId: '',
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
    await this.props.patient.fetch({ relations: true, deep: false });

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
    const diagnoses = (_action === 'new' ? this.props.patient.get('diagnoses') : this.props.operationReport.get('diagnoses'));
    const form = clone(this.state.form);
    each(form, (value, key) => { form[key] = (has(data, key) ? data[key] : value); });
    this.setState({ form, action: _action, diagnoses: diagnoses.models });
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

  onCloseCompletedModal() {
    const { opReportId } = this.state;
    this.props.history.push(`/patients/operationReport/${this.state.patient._id}/${opReportId}`);
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
      // const operativePlan = new OperativePlanModel();
      operationReport.set(form);
      const model = await operationReport.save();

      // Attached operativePlan to patient object
      if (action === 'new') {
        // Duplicate diagnostics to operation plan
        const diagnoses = patient.get('diagnoses');
        if (diagnoses.length > 0) {
          const tasks = [];
          each(diagnoses.models, (diagnosis) => {
            const attributes = diagnosis.cloneAttributes();

            const _model = new DiagnosisModel();
            _model.set(attributes);
            tasks.push(_model.save());
          });

          const resp = await Promise.all(tasks);
          resp.forEach((m) => {
            operationReport.get('diagnoses').add(m);
          });

          await operationReport.save();
        }

        patient.get('operativePlans').add(model);
        await patient.save();
        this.props.history.push(`/patients/operativePlan/${patient.id}/${model.id}`);
        this.setState({ action: 'update' });
      } else {
        patient.trigger('change');
      }

      // Create operation report
      if (operationReport.get('status') === 'completed') {
        const id = await this.createOperationReport();
        this.setState({
          opReportId: id,
          markedCompleted: true
        });
      } else {
        this.setState({ formSuccess: true });
      }
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  createOperationReport() {
    return new Promise(async (resolve, reject) => {
      const { patient } = this.props;
      let { operationReport } = this.props;
      operationReport = operationReport.toJSON();
      const toCopy = pick(operationReport, ['additionalNotes', 'caseComplexity', 'procedures', 'operationDescription', 'surgeon', 'diagnoses']);
      const { diagnoses } = toCopy;
      delete toCopy.diagnoses;
      toCopy.patient = patient.id;
      toCopy.surgeryDate = moment().format(dateFormat);

      try {
        const operationReportModel = new OperationReportModel();
        operationReportModel.set(toCopy);
        operationReportModel.get('preOpDiagnoses').set(diagnoses.models);
        await operationReportModel.save();
        this.props.patient.get('operationReports').add(operationReportModel);
        await this.props.patient.save();
        resolve(operationReportModel.id);
      } catch (err) {
        reject(err);
      }
    });
  }

  render() {
    const {
      patient,
      formError,
      formSuccess,
      markedCompleted,
      form,
      action,
    } = this.state;

    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>{`${capitalize(action)} Operative Plan`}</span>
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
                      <Diagnosis model={this.props.patient} readonly />
                      <Diagnosis model={this.props.patient} showSecondary readonly />
                    </div>
                    <div className="column">
                      <Allergy model={this.props.patient} readonly />
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
              <Procedure model={this.props.patient} onChange={this.handleUserInput} />
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
                        value={form.caseComplexity}
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
                    <button className="button is-danger m-r-5" onClick={this.goBack}>{action === 'new' ? 'Cancel' : 'Return'}</button>
                    <button className="button is-primary m-r-5" onClick={this.submitForm}>{action === 'new' ? 'Add' : 'Update'}</button>
                    <button className={`button is-primary ${(action === 'new' ? 'is-hidden' : '')}`} onClick={this.markComplete}>
                      <i className="fa fa-check inline-block m-r-5" /> Complete Plan
                    </button>
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
          contentText="Operative Plan was saved successfully!"
          little
        />
        <ModalView
          isVisible={markedCompleted}
          onClose={this.onCloseCompletedModal}
          headerTitle="Success!"
          contentText="Operative Plan was marked completed successfully, you'll be redirected to Operation Report now"
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
