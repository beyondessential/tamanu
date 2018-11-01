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
import { createDispense } from '../../actions/medications';
import { visitOptions } from '../../constants';

class Dispense extends Component {
  state = {
    // formError: false,
    selectValue: '',
    prescriptionDate: moment(),
  }

  // onCloseModal = () => {
  //   this.setState({ formError: false });
  // }

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

  render() {
    const { prescriptionDate } = this.state;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              Dispense Medication
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
              const dispense = Serializer.serialize(e.target, { hash: true });
              if (dispense.patient && dispense.visit && dispense.medication && dispense.prescription) {
                this.props.createDispense(dispense);
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
                    label="Quantity Dispensed"
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
                    name="billTo"
                    label="Bill To"
                    required
                  />
                </div>
              </div>
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to="/medication">Cancel</Link>
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
  createDispense: dispense => dispatch(createDispense(dispense)),
});

export default connect(undefined, mapDispatchToProps)(Dispense);
