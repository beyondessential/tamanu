import React, { Component } from 'react';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import BootstrapTable from 'react-bootstrap-table-next';
import CustomDateInput from '../../components/CustomDateInput';
import { fetchPatients } from '../../actions/patients';
import { patientColumns, reportOptions } from '../../constants';

class Reports extends Component {
  state = {
    startDate: moment(),
    endDate: moment(),
    selectValue: '',
    generated: false
  }

  componentDidMount() {
    this.props.fetchPatients();
  }

  onChangeStartDate = (date) => {
    this.setState({
      startDate: date
    });
  }

  onChangeEndDate = (date) => {
    this.setState({
      endDate: date
    });
  }

  updateValue = (newValue) => {
    this.setState({
      selectValue: newValue,
    });
  }

  generateReport = () => {
    this.setState({ generated: true });
  }

  render() {
    const { startDate, endDate, generated } = this.state;
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
          <div className="form">
            <div className="columns">
              <div className="column is-6">
                <div className="column">
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
            </div>
            <div className="columns">
              <div className="column is-4">
                <div className="column">
                  <span className="header">
                    Start Date
                  </span>
                  <DatePicker
                    name="startDate"
                    customInput={<CustomDateInput />}
                    selected={startDate}
                    onChange={this.onChangeStartDate}
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
                    End Date
                  </span>
                  <DatePicker
                    name="endDate"
                    customInput={<CustomDateInput />}
                    selected={endDate}
                    onChange={this.onChangeEndDate}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </div>
            </div>
            <div className="column has-text-right">
              <button className="button is-primary" onClick={this.generateReport}>Generate Report</button>
            </div>
          </div>
          {generated &&
            <div className="form">
              <div className="form-header">
                <span>
                  Diagnostic Testing Report {moment(startDate).format('MM/DD/YYYY')} - {moment(endDate).format('MM/DD/YYYY')}
                </span>
              </div>
              <div className="columns">
                <div className="form-table">
                  <BootstrapTable
                    keyField="id"
                    className="custom-table"
                    data={patients}
                    columns={patientColumns}
                    defaultSortDirection="asc"
                  />
                  <div className="column has-text-right">
                    <button className="button is-primary" onClick={this.generateReport}>Export Report</button>
                  </div>
                </div>
              </div>
            </div>
          }
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
