import React, { Component } from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
// import ModalView from '../../components/Modal';
import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import { createMedication } from '../../actions/medications';
import { visitOptions } from '../../constants';

class NewMedication extends Component {
  state = {
    // formError: false,
    selectValue: '',
    prescriptionDate: moment(),
  }

  updateValue = (newValue) => {
    this.setState({
      selectValue: newValue,
    });
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
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              New Medication Request
            </span>
            <div className="view-action-buttons">
              <button>
                + New Request
              </button>
              <button>
                Dispense Medication
              </button>
              <button>
                Return Medication
              </button>
            </div>
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
                  <InputGroup
                    name="patient"
                    label="Patient"
                    required
                  />
                </div>
                <div className="column">
                  <div className="column">
                    <span className="header">
                      Visit
                    </span>
                    <Select
                      id="state-select"
                      ref={(ref) => { this.select = ref; }}
                      onBlurResetsInput={false}
                      onSelectResetsInput={false}
                      options={visitOptions}
                      simpleValue
                      clearable
                      name="selected-state"
                      disabled={this.state.disabled}
                      value={this.state.selectValue}
                      onChange={this.updateValue}
                      rtl={this.state.rtl}
                      searchable={this.state.searchable}
                    />
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <InputGroup
                    name="medication"
                    label="Medication"
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <InputGroup
                    name="prescription"
                    label="Prescription"
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-5">
                  <div className="column">
                    <span className="header">
                      Prescription Date
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
              </div>
              <div className="columns">
                <div className="column is-4">
                  <InputGroup
                    name="quantity"
                    label="Quantity Requested"
                    required
                  />
                </div>
                <div className="column is-4">
                  <InputGroup
                    name="refills"
                    label="Refills"
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <InputGroup
                    name="fullfillRequest"
                    label="Fullfill Request"
                    required
                  />
                </div>
              </div>
              <div className="column has-text-right">
                <a className="button is-danger cancel">Cancel</a>
                <button className="button" type="submit">Add</button>
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

const mapDispatchToProps = dispatch => ({
  createMedication: medication => dispatch(createMedication(medication)),
});

export default connect(undefined, mapDispatchToProps)(NewMedication);
