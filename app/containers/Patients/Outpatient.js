import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import CustomDateInput from '../../components/CustomDateInput';

const options = [
  { value: 'australian-capital-territory', label: 'Australian Capital Territory', className: 'State-ACT' },
  { value: 'new-south-wales', label: 'New South Wales', className: 'State-NSW' },
  { value: 'victoria', label: 'Victoria', className: 'State-Vic' },
  { value: 'queensland', label: 'Queensland', className: 'State-Qld' },
  { value: 'western-australia', label: 'Western Australia', className: 'State-WA' },
  { value: 'south-australia', label: 'South Australia', className: 'State-SA' },
  { value: 'tasmania', label: 'Tasmania', className: 'State-Tas' },
  { value: 'northern-territory', label: 'Northern Territory', className: 'State-NT' },
];
export default class Outpatient extends Component<Props> {
  state = {
    startDate: moment(),
    selectValue: ''
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
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Today's Outpatients
          </span>
          <div className="view-action-buttons">
            <button>
              Patient Check In
            </button>
          </div>
        </div>
        <div className="create-container">
          <div className="columns form">
            <div className="column is-4">
              <span className="header">
                Visit Date
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
                Location
              </span>
              <Select
                id="state-select"
                ref={(ref) => { this.select = ref; }}
                onBlurResetsInput={false}
                onSelectResetsInput={false}
                autoFocus
                options={options}
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
            <div className="column is-4">
              <a className="button is-primary search">Search</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
