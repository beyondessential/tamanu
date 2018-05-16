import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
// import ModalView from '../../components/Modal';
import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import { fetchOnePatient } from '../../actions/patients';
import { visitOptions } from '../../constants';

class EditVisit extends Component {
  state = {
    // formError: false,
    prescriptionDate: moment(),
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    this.props.fetchOnePatient(id);
  }

  onChangeDate = (date) => {
    this.setState({
      prescriptionDate: date,
    });
  }

  // onCloseModal = () => {
  //   this.setState({ formError: false });
  // }

  render() {
    const { prescriptionDate } = this.state;
    const { patient } = this.props;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              Edit Visit
            </span>
          </div>
          <form
            className="create-container"
            onSubmit={(e) => {
              e.preventDefault();
              const medication = Serializer.serialize(e.target, { hash: true });
              if (medication.patient && medication.visit && medication.medication && medication.prescription) {
                this.props.createMedication(medication);
              } else {
                // this.setState({ formError: true });
              }
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
                          {patient.firstName} {patient.lastName}
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
                    label="Examiner"
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
    patient: state.patients.onePatient
  };
}

const mapDispatchToProps = dispatch => ({
  fetchOnePatient: id => dispatch(fetchOnePatient(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditVisit);
