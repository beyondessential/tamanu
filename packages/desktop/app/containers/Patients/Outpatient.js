import React, { Component } from 'react';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import { map, isEmpty } from 'lodash';
import BootstrapTable from 'react-bootstrap-table-next';
import CustomDateInput from '../../components/CustomDateInput';
import { patientColumns, locationOptions } from '../../constants';
import { PatientsCollection } from '../../collections';
import { SearchButton, TopBar } from '../../components';

class Outpatient extends Component<Props> {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    startDate: moment(),
    selectValue: ''
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.props.collection.fetch({ options: { query: { fun: 'visit_by_date' } } });
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
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
    let { models: patients } = this.props.collection;
    if (!isEmpty(patients)) patients = map(patients, patient => patient.attributes);
    return (
      <div className="create-content">
        <TopBar
          title="Today's Outpatients"
          button={{
            to: "/patients/edit/new",
            can: { do: 'create', on: 'patient' },
            children: 'Patient Check In'
          }}
        />
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
                options={locationOptions}
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
              <SearchButton />
            </div>
          </div>
          <div className="columns form-table">
            <BootstrapTable
              keyField="_id"
              className="custom-table"
              data={patients}
              columns={patientColumns}
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

const mapDispatchToProps = () => ({
  collection: new PatientsCollection()
});

export default connect(mapStateToProps, mapDispatchToProps)(Outpatient);
