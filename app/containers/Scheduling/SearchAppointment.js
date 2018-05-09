import React, { Component } from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import BootstrapTable from 'react-bootstrap-table-next';
import Serializer from '../../utils/form-serialize';
import CustomDateInput from '../../components/CustomDateInput';
import { createMedication } from '../../actions/medications';
import { visitOptions, medicationColumns } from '../../constants';

const medications = [];

class SearchAppointment extends Component {
  state = {
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

  render() {
    const { prescriptionDate } = this.state;
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Search Appointments
          </span>
          <div className="view-action-buttons">
            <button>
              + New Appointment
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
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    Start Date
                  </span>
                  <DatePicker
                    name="startDate"
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
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    Status
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
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    Type
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
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    With
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
                <div className="column has-text-right">
                  <button className="button is-primary" type="submit">Search</button>
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <BootstrapTable
                  keyField="id"
                  data={medications}
                  columns={medicationColumns}
                  defaultSortDirection="asc"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createMedication: medication => dispatch(createMedication(medication)),
});

export default connect(undefined, mapDispatchToProps)(SearchAppointment);
