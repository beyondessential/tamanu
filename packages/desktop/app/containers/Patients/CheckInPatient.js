import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { isEmpty } from 'lodash';
// import ModalView from '../../components/Modal';
import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import { fetchOnePatient, checkInPatient } from '../../actions/patients/patients';
import { visitOptions } from '../../constants';
import { PatientModel } from '../../models';

class CheckInPatient extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    // formError: false,
    prescriptionDate: moment(),
  }

  componentDidMount() {
    const { patientModel } = this.props;
    const { id } = this.props.match.params;
    patientModel.set({ _id: id });
    patientModel.fetch();
    patientModel.on('change', this.handleChange);
  }

  componentWillUnmount() {
    const { patientModel } = this.props;
    patientModel.off('change', this.handleChange);
  }

  onChangeDate = (date) => {
    this.setState({
      prescriptionDate: date,
    });
  }

  handleChange() {
    this.forceUpdate();
  }

  // onCloseModal = () => {
  //   this.setState({ formError: false });
  // }

  render() {
    const { prescriptionDate } = this.state;
    const { patientModel: { attributes: patient } } = this.props;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              Patient Check In
            </span>
          </div>
          <form
            className="create-container"
            onSubmit={(e) => {
              e.preventDefault();
              const patientValue = Serializer.serialize(e.target, { hash: true });
              this.props.checkInPatient(patientValue);
            }}
          >
            <div className="form">
              <div className="columns">
                <div className="column">
                  <div className="column visit-header">
                    <span>
                      Visit Information
                    </span>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="columns">
                    <div className="column">
                      <div className="column">
                        <span>Name: </span>
                        <span>
                          {patient.firstName}
                          {' '}
                          {patient.lastName}
                        </span>
                      </div>
                    </div>
                    <div className="column level-left">
                      <div className="card-info">
                        {patient.displayId}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <div className="column">
                    <span className="header">
                      Admission Date
                    </span>
                    <DatePicker
                      name="prescriptionDate"
                      customInput={<CustomDateInput />}
                      selected={prescriptionDate}
                      onChange={this.onChangeDate}
                      peekNextMonth
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                </div>
                <div className="column is-4">
                  <div className="column">
                    <span className="header">
                      Discharge Date
                    </span>
                    <DatePicker
                      name="prescriptionDate"
                      customInput={<CustomDateInput />}
                      selected={prescriptionDate}
                      onChange={this.onChangeDate}
                      peekNextMonth
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                </div>
                <div className="column is-4">
                  <InputGroup
                    name="location"
                    label="Location"
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <div className="column">
                    <span className="header">
                      Blood Type
                    </span>
                    <Select
                      id="state-select"
                      ref={(ref) => { this.select = ref; }}
                      onBlurResetsInput={false}
                      onSelectResetsInput={false}
                      options={visitOptions}
                      simpleValue
                      clearable
                      name="bloodType"
                      disabled={this.state.disabled}
                      value={this.state.bloodType}
                      onChange={this.updateBloodValue}
                      rtl={this.state.rtl}
                      searchable={this.state.searchable}
                    />
                  </div>
                </div>
                <div className="column is-4">
                  <InputGroup
                    name="examiner"
                    label="Doctor/Nurse"
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="column">
                    <span className="header">
                      Reason For Visit
                    </span>
                    <textarea className="textarea" />
                  </div>
                </div>
              </div>
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to="/patients">Cancel</Link>
                <button className="button is-primary" type="submit">Admit</button>
              </div>
            </div>
          </form>
        </div>
        {/* <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        /> */}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    patient: state.patients.onePatient,
  };
}

const mapDispatchToProps = dispatch => ({
  patientModel: new PatientModel(),
  fetchOnePatient: id => dispatch(fetchOnePatient(id)),
  checkInPatient: patient => dispatch(checkInPatient(patient)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckInPatient);
