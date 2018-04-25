import React, { Component } from 'react';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import BootstrapTable from 'react-bootstrap-table-next';
import CustomDateInput from '../../components/CustomDateInput';
import { fetchPatients } from '../../actions/patients';
import { parentColumns, reportOptions } from '../../constants';

class Reports extends Component {
  state = {
    startDate: moment(),
    selectValue: ''
  }

  componentDidMount() {
    this.props.fetchPatients();
  }

  onChangeDate = (date) => {
    this.setState({
      startDate: date
    });
  }

  updateValue = (newValue) => {
    this.setState({
      selectValue: newValue,
    });
  }

  render() {
    const { startDate } = this.state;
    const { patients } = this.props;
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Patient Report
          </span>
          <div className="view-action-buttons">
            <button>
              Patient Check In
            </button>
          </div>
        </div>
        <div className="create-container">
          <div className="columns form">
            <div className="column is-6">
              <span className="header">
                Report Type
              </span>
              <Select
                id="state-select"
                ref={(ref) => { this.select = ref; }}
                onBlurResetsInput={false}
                onSelectResetsInput={false}
                options={reportOptions}
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
          <div className="columns form">
            <div className="column is-4">
              <span className="header">
                Report Type
              </span>
              <DatePicker
                customInput={<CustomDateInput />}
                selected={startDate}
                onChange={this.onChangeDate}
                peekNextMonth
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
            <div className="column is-4">
              <span className="header">
                Report Type
              </span>
              <DatePicker
                customInput={<CustomDateInput />}
                selected={startDate}
                onChange={this.onChangeDate}
                peekNextMonth
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
          </div>
          <div className="columns form-table">
            <BootstrapTable
              keyField="id"
              className="custom-table"
              data={patients}
              columns={parentColumns}
              defaultSortDirection="asc"
            />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    patients: state.patients.patients
  };
}

const mapDispatchToProps = dispatch => ({
  fetchPatients: () => dispatch(fetchPatients()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Reports);
