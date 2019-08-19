import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { outPatientColumns, columnStyle, headerStyle } from '../../constants';
import { PatientsCollection } from '../../collections';
import {
  SearchButton,
  TopBar,
  Button,
  Container,
  FormRow,
  DateInput,
  SelectInput,
  SimpleTable,
} from '../../components';

const getActionsColumn = () => ({
  id: 'actions',
  Header: 'Actions',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
  Cell: props => <ActionsColumn {...props} />,
});

const ActionsColumn = ({ original: { _id } }) => (
  <div key={_id}>
    <Button variant="contained" color="primary" to={`/patients/editPatient/${_id}`}>
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
  };

  componentWillMount() {
    this.columns = [
      ...outPatientColumns.slice(0, outPatientColumns.length - 1),
      getActionsColumn(),
    ];
    this.props.collection.on('update', this.handleChange);
    this.getPatients();
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  onChangeDate = date => {
    this.setState({
      startDate: date,
    });
  };

  getPatients() {
    this.props.collection.fetch({ data: { 'visits.@count': '>|0', admitted: false } });
  }

  updateValue = newValue => {
    this.setState({
      selectValue: newValue,
    });
  };

  handleChange() {
    this.forceUpdate();
  }

  render() {
    const { startDate } = this.state;
    const patients = this.props.collection.toJSON();
    return (
      <React.Fragment>
        <TopBar
          title="Outpatients"
          button={{
            to: '/patients/edit/new',
            can: { do: 'create', on: 'patient' },
            children: 'New Patient',
          }}
        />
        <Container autoHeight>
          <FormRow>
            <DateInput label="Visit Date" onChange={this.onChangeDate} name="visitDate" />
            <SelectInput
              label="Location"
              name="selected-state"
              value={this.state.selectValue}
              onChange={this.updateValue}
            />
          </FormRow>
          <FormRow>
            <SearchButton />
          </FormRow>
        </Container>
        <SimpleTable
          data={patients}
          columns={this.columns}
          emptyNotification="No patients found."
        />
      </React.Fragment>
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Outpatient);
