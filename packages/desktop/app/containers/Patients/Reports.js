import React, { Component } from 'react';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import BootstrapTable from 'react-bootstrap-table-next';
import CustomDateInput from '../../components/CustomDateInput';
import { fetchPatients } from '../../actions/patients/patients';
import { patientColumns, reportOptions } from '../../constants';
import styled from 'styled-components';

const CreateContent = styled.div`
  height: 100vh;
  font-size: 15px;
`;
const CreateTopBar = styled.div`
  margin: 0 auto;
  border-bottom: 1px solid #d2dae3;
  background: $main-white-color;
  padding: 0 15px;
  height: 55px;
  > span {
    float: left;
    margin: 0;
    line-height: 55px;
    letter-spacing: -1px;
    color: $main-light-dark-color;
    font-size: 28px;
    font-weight: 600;
    &.title {
      font-size: 18px !important;
      padding: 10px 30px !important;
      margin-top: 8px !important;
      float: right;
      color: $main-white-color;
    }
    &.sub-title {
      font-size: 15px !important;
      padding: 18px !important;
      margin-top: 8px !important;
      float: right;
      color: $main-light-dark-color;
    }
  }
  .view-action-buttons {
    float: right;
    button.button {
      margin: 10px 0 10px 15px;
      border: 1px solid $main-green-color;
      background-color: transparent;
      color: $main-green-color;
      font-size: 14px;
      padding: 7px;
      border-radius: 5px;
    }
    a.button {
      margin: 10px 0 10px 15px;
      border: 1px solid $main-green-color;
      background-color: transparent;
      color: $main-green-color;
      font-size: 14px;
      padding: 7px;
      border-radius: 5px;
      display: inline-block;
    }
  }
`;

const CreateForm = styled.div`
    margin: 20px 20px;
    background: white;
    &.with-padding {
      padding: 0 15px;
    }
    .visit-header {
      margin: 10px;
      background: $main-light-blue-color;
      > span {
        font-size: 24px;
        color: #2e4359;
      }
    }
    .medication-header {
      margin: 5px 3px;
      background: $main-light-blue-color;
      margin: 0;
      text-align: center;
      span.text {
        font-size: 18px;
        color: #2e4359;
      }
    }
    .medication-chart-cell {
      text-align: center;
      width: 100%;
      position: relative;
      .button,
      .icon {
        position: absolute;
        right: 0;
        &.is-pulled-left {
          right: auto;
          left: 0;
        }
      }
    }
    .rt-td.taken {
      background: rgb(230, 255, 230);
    }
    .rt-td.not-taken {
      background: rgb(255, 230, 230);
    }
    .isRequired {
      color: red;
    }
    .cancel {
      margin-right: 5px;
    }
    .header {
      color: $main-light-dark-color;
      display: inline-block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    p:not(.help) {
      font-size: 18px;
    }
    .radio {
      span {
        margin-left: 5px;
      }
    }
    .search {
      margin-top: 25px;
    }
    .form-header {
      padding: 10px;
      background: #428bca;
      span {
        color: $main-white-color;
        font-size: 24px;
        font-weight: bold;
      }
    }
    table {
      width: 100%;
    }
    .calendar-height {
      height: 500px;
      min-height: calc(100vh - 120px);
    }
    .card-info {
      width: 120px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: $main-light-gray-color;
      border-radius: 5px;
      margin-right: 10px;
    }
    .title {
      font-size: 16px;
      font-weight: 400;
    }
    .full-name {
      font-size: 22px;
      font-weight: 600;
    }
    .add-button {
      color: #428bca;
      text-decoration: none;
      padding: 0;
      text-transform: none;
      cursor: pointer;
      background: transparent;
      font-size: 16px;
      border: none;
      font-weight: bold;
    }
    .border-bottom {
      border-bottom: 2px solid #eff2f5;
    }
    .tabs {
      a {
        color: #6784a2;
      }
      .selected {
        color: #2f4358;
        font-weight: 600;
      }
    }
    .tab-content {
      .history-pane {
        padding: 0;
        background: #dee2e7;
        .header {
          background: #eff2f5;
          width: 100%;
          margin: 0;
          cursor: pointer;
          span {
            background: #ccc;
            display: inline-block;
            padding: 5px 15px;
            margin-right: 15px;
          }
        }
        .text {
          background: #f7f9fa;
          padding: 15px 15px 20px;
          font-weight: bold;
        }
        a {
          color: #32425a;
          background: transparent;
          & :hover {
            border: none;
          }
        }
      }
    }
    .checkbox {
      padding: 30px;
      span {
        padding: 10px;
      }
    }
  }
  .form-table {
    margin: 20px 20px;
    background: white;
    .table {
      width: 100%;
    }
  }
  .second-form {
    margin: 20px 20px;
    background: white;
    .isRequired {
      color: red;
    }
    .cancel {
      margin-right: 5px;
    }
`;

class Reports extends Component {
  state = {
    startDate: moment(),
    endDate: moment(),
    selectValue: '',
    generated: false,
  };

  componentDidMount() {
    this.props.fetchPatients();
  }

  onChangeStartDate = date => {
    this.setState({
      startDate: date,
    });
  };

  onChangeEndDate = date => {
    this.setState({
      endDate: date,
    });
  };

  updateValue = newValue => {
    this.setState({
      selectValue: newValue,
    });
  };

  generateReport = () => {
    this.setState({ generated: true });
  };

  render() {
    const { startDate, endDate, generated } = this.state;
    const { patients } = this.props;
    return (
      <CreateContent>
        <CreateTopBar>
          <span>Patient Report</span>
          <div className="view-action-buttons">
            <button>Patient Check In</button>
          </div>
        </CreateTopBar>
        <div>
          <CreateForm>
            <div className="columns">
              <div className="column is-6">
                <div className="column">
                  <span className="header">Report Type</span>
                  <Select
                    id="state-select"
                    ref={ref => {
                      this.select = ref;
                    }}
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
                  <span className="header">Start Date</span>
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
                  <span className="header">End Date</span>
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
              <button className="button is-primary" onClick={this.generateReport}>
                Generate Report
              </button>
            </div>
          </CreateForm>
          {generated && (
            <CreateForm>
              <div className="form-header">
                <span>
                  Diagnostic Testing Report {moment(startDate).format('MM/DD/YYYY')} -{' '}
                  {moment(endDate).format('MM/DD/YYYY')}
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
                    <button className="button is-primary" onClick={this.generateReport}>
                      Export Report
                    </button>
                  </div>
                </div>
              </div>
            </CreateForm>
          )}
        </div>
      </CreateContent>
    );
  }
}

function mapStateToProps(state) {
  return {
    patients: state.patients.patients,
  };
}

const mapDispatchToProps = dispatch => ({
  fetchPatients: () => dispatch(fetchPatients()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Reports);
