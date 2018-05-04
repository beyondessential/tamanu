import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';

import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import { visitOptions } from '../../constants';

class NewInvoice extends Component {
  state = {
    billDate: moment(),
    selectValue: '',
  }

  onChangeDate = (date) => {
    this.setState({
      billDate: date,
    });
  }

  updateValue = (newValue) => {
    this.setState({
      selectValue: newValue,
    });
  }

  render() {
    const { billDate } = this.state;
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              New Invoice
            </span>
            <div className="view-action-buttons">
              <button>
                + New Invoice
              </button>
              <button>
                + Add Deposit
              </button>
            </div>
          </div>
          <div className="detail">
            <div className="tabs-container">
              <Link to="/invoices" replace>
                Billed
              </Link>
              <Link to="/invoices/draft" replace>
                Drafts
              </Link>
              <Link to="/invoices/all" replace>
                All Invoices
              </Link>
              <Link to="/invoices/paid" replace>
                Paid
              </Link>
            </div>
            <div className="invoice-form">
              <div className="columns">
                <div className="column is-4">
                  <div className="column">
                    <span className="input-group-title">
                      Bill Date
                    </span>
                    <DatePicker
                      name="billDate"
                      customInput={<CustomDateInput />}
                      selected={billDate}
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
                    name="patient"
                    label="Patient"
                    required
                  />
                </div>
                <div className="column is-4">
                  <div className="column">
                    <span className="input-group-title">
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
                <div className="column is-4">
                  <InputGroup
                    name="patient"
                    label="External Invoice #"
                  />
                </div>
                <div className="column is-4">
                  <div className="column">
                    <span className="input-group-title">
                      Payment Profile
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
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default NewInvoice;
