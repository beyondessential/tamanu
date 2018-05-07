import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import BootstrapTable from 'react-bootstrap-table-next';

import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import { visitOptions, invoiceLineItemColumns, invoicePaymentColumns } from '../../constants';
import { fetchInvoices } from '../../actions/invoices';

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
    const { invoices } = this.props;
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
              <div className="columns">
                <div className="column">
                  <div className="column">
                    <div className="panel-heading">
                      <span className="panel-title">
                        Line Items
                      </span>
                      <button className="button is-primary align-right">+ Add Line Item</button>
                    </div>
                    <div>
                      <BootstrapTable
                        keyField="id"
                        data={invoices}
                        columns={invoiceLineItemColumns}
                        defaultSortDirection="asc"
                      />
                    </div>
                    <div className="panel-heading margin-t-30">
                      <span className="panel-title">
                        Remarks
                      </span>
                    </div>
                    <div className="margin-t-10">
                      <textarea className="textarea" />
                    </div>
                    <div className="panel-heading margin-t-30">
                      <span className="panel-title">
                        Payments
                      </span>
                      <button className="button is-primary align-right">+ Add Payment</button>
                    </div>
                    <div>
                      <BootstrapTable
                        keyField="id"
                        data={invoices}
                        columns={invoicePaymentColumns}
                        defaultSortDirection="asc"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="column">
                    <div className="has-text-right margin-t-30">
                      <Link className="button is-danger cancel" to="/invoices">Cancel</Link>
                      <button className="button" type="submit">Add</button>
                      <button className="button">Print</button>
                    </div>
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

function mapStateToProps(state) {
  return {
    invoices: state.invoices.invoices
  };
}

const mapDispatchToProps = dispatch => ({
  fetchInvoices: () => dispatch(fetchInvoices()),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewInvoice);
