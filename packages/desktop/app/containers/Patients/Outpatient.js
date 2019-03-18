import React, { Component } from 'react';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';
import CustomDateInput from '../../components/CustomDateInput';
import {
  outPatientColumns, locationOptions, pageSizes, columnStyle, headerStyle,
} from '../../constants';
import { PatientsCollection } from '../../collections';
import { SearchButton, TopBar, Button } from '../../components';

const getActionsColumn = () => ({
  id: 'actions',
  Header: 'Actions',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
  Cell: (props) => <ActionsColumn {...props} />,
});

const ActionsColumn = ({ original: { _id } }) => (
  <div key={_id}>
    <Button
      variant="contained"
      color="primary"
      to={`/patients/editPatient/${_id}`}
    >
View
    </Button>
  </div>
);

class Outpatient extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    startDate: moment(),
    selectValue: '',
  }

  componentWillMount() {
    this.columns = [...outPatientColumns.slice(0, outPatientColumns.length - 1), getActionsColumn()];
    this.props.collection.on('update', this.handleChange);
    this.getPatients();
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
  }

  onChangeDate = (date) => {
    this.setState({
      startDate: date,
    });
  }

  updateValue = (newValue) => {
    this.setState({
      selectValue: newValue,
    });
  }

  getPatients() {
    this.props.collection.fetch({ data: { 'visits.@count': '>|0', admitted: false } });
  }

  render() {
    const { startDate } = this.state;
    const patients = this.props.collection.toJSON();
    return (
      <div className="create-content">
        <TopBar
          title="Outpatients"
          button={{
            to: '/patients/edit/new',
            can: { do: 'create', on: 'patient' },
            children: 'New Patient',
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
            <div className="column is-4" style={{ paddingTop: 37 }}>
              <SearchButton />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <ReactTable
                keyField="_id"
                data={patients}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.patients}
                columns={this.columns}
                className="-striped"
                defaultSortDirection="asc"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    patients: state.patients.patients,
  };
}

const mapDispatchToProps = () => ({
  collection: new PatientsCollection(),
});

export default connect(mapStateToProps, mapDispatchToProps)(Outpatient);
