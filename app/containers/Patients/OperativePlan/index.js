import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Select from 'react-select';
import DatePicker from 'react-datepicker';

// import Serializer from '../../../utils/form-serialize';
import Allergy from './Allergy';
import Dignosis from './Dignosis';
import InputGroup from '../../../components/InputGroup';
import TextareaGroup from '../../../components/TextareaGroup';

// import Serializer from '../../../utils/form-serialize';
import { PatientModel, AllergyModel } from '../../../models';
import { getDifferenceDate, operativePlanStatusList } from '../../../constants';

class OperativePlan extends Component {
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
  }

  state = {
    patient: this.props.model.attributes
  }

  async componentDidMount() {
    const { patientId } = this.props.match.params;
    this.props.model.on('change', this.handleChange);
    this.props.model.set({ _id: patientId });
    await this.props.model.fetch();
  }

  componentWillUnmount() {
    this.props.model.off('change', this.handleChange);
  }

  handleChange = async () => {
    try {
      const patient = await this.props.model.toJSON({ relations: true });
      if (patient.dateOfBirth !== '') patient.age = getDifferenceDate(moment(), moment(patient.dateOfBirth));
      this.setState({ patient }, () => this.forceUpdate());
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  goBack() {
    this.props.history.push(`/patients/editPatient/${this.state.patient._id}`);
  }

  // changeTab = (tabName) => {
  //   this.setState({ selectedTab: tabName });
  // }

  // updatePatient = (patient) => {
  //   const updatedPatient = patient;
  //   updatedPatient.birthday = moment(this.props.updatedBirthday).format('YYYY-MM-DD');
  //   updatedPatient.referredDate = moment(this.props.updatedReferredDate).format('YYYY-MM-DD');
  //   this.props.model.set(updatedPatient);
  //   if (this.props.model.isValid()) {
  //     this.props.model.save(null, {
  //       // success: (model, response) => {
  //       success: () => {
  //         this.props.history.push('/patients');
  //       },
  //       // error: (model, response) => {
  //       error: () => {}
  //     });
  //   }
  // }

  render() {
    const { patient } = this.state;

    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
               New Operative Plan
            </span>
          </div>
          <form className="create-container">
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
                      <Dignosis patient={patient} model={this.props.model} showSecondary={false} readonly />
                      <Dignosis patient={patient} model={this.props.model} showSecondary readonly />
                    </div>
                    <div className="column">
                      <Allergy patient={patient} model={this.props.model} readonly />
                    </div>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="firstName"
                    label="Operation Description"
                    tabIndex={1}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-10 p-r-5">
                  <InputGroup
                    name="middleName"
                    label="Procedure"
                    required
                    tabIndex={2}
                  />
                </div>
                <div className="column is-2 p-l-5">
                  <button className="button is-primary m-t-40"> <i className="fa fa-plus p-r-5 inline-block" /> Add Procedure</button>
                </div>
              </div>
              <div className="columns">
                <div className="column is-10">
                  <div className="columns">
                    <div className="column">
                      <InputGroup
                        name="culturalName"
                        label="Surgeon"
                        tabIndex={4}
                      />
                    </div>
                    <div className="column">
                      <div className="column">
                        <span className="header">
                          Status
                        </span>
                        <Select
                          id="state-select"
                          ref={(ref) => { this.select = ref; }}
                          onBlurResetsInput={false}
                          onSelectResetsInput={false}
                          options={operativePlanStatusList}
                          clearable={false}
                          placeholder="Status"
                          simpleValue
                          name="status"
                          disabled={this.state.disabled}
                          value={this.state.sex}
                          onChange={this.updateSexValue}
                        />
                      </div>
                    </div>
                    <div className="column">
                      <InputGroup
                        name="clinicSite"
                        label="Case Complexity"
                        tabIndex={9}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="firstName"
                    label="Instructions Upon Admission"
                    tabIndex={1}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="firstName"
                    label="Additional Notes"
                    tabIndex={1}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="column has-text-right">
                    <button className="button is-danger cancel" onClick={this.goBack}>Cancel</button>
                    <button className="button" type="submit">Add</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
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
  model: new PatientModel(),
  allergyModel: new AllergyModel(),
});

export default connect(undefined, mapDispatchToProps)(OperativePlan);
