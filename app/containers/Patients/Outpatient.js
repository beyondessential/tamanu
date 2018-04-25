import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import CustomDateInput from '../../components/CustomDateInput';

export default class Outpatient extends Component<Props> {
  state = {
    startDate: moment()
  }

  onChangeDate = (date) => {
    this.setState({
      startDate: date
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
            <div className="columns">
              <div className="column is-4">
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
          </div>
        </div>
      </div>
    );
  }
}
