import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import { TopBar, BrowsableTable, Button } from '../../components';
import { PatientsCollection } from '../../collections';
import { ProgramModel } from '../../models';
import { programsPatientsColumns, headerStyle, columnStyle } from '../../constants';

export default class ProgramPatients extends Component {
  patientsCollection = new PatientsCollection();

  programModel = new ProgramModel();

  state = {
    program: null,
  }

  componentWillMount() {
    this.programModel.on('change', this.handleChange);
    this.fetchProgram();
  }

  componentWillReceiveProps(newProps) {
    this.fetchProgram(newProps);
  }

  selectPatient = (patientId) => {
    const { history, match: { params: { programId } }} = this.props;
    history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  getTableColumns = () => ([
    ...programsPatientsColumns,
    {
      id: 'actions',
      Header: 'Actions',
      headerStyle,
      style: columnStyle,
      Cell: ({ original: { _id } }) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.selectPatient(_id)}
        >
          Select Patient
        </Button>
      ),
      filterable: false,
    },
  ])

  searchSubmit = (keyword) => {
    this.patientsCollection.setKeyword(keyword);
    this.forceUpdate();
  }

  handleChange = () => {
    this.setState({ program: this.programModel.toJSON() });
  }

  fetchProgram(props = this.props) {
    const { match: { params: { programId } } } = props;
    this.programModel.set('_id', programId).fetch();
  }

  render() {
    const { program } = this.state;
    return (
      <React.Fragment>
        <TopBar
          title={program && program.name ? program.name : 'Patients'}
          search={{
            onSubmit: this.searchSubmit,
            onClear: this.searchSubmit,
          }}
          buttons={[{
            to: '/patients/edit/new',
            can: { do: 'create', on: 'patient' },
            children: 'New Patient',
          }]}
        />
        <Grid container item>
          <BrowsableTable
            collection={this.patientsCollection}
            columns={this.getTableColumns()}
            emptyNotification="No requests found"
          />
        </Grid>
      </React.Fragment>
    );
  }
}
