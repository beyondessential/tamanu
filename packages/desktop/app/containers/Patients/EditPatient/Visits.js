import React, { Component } from 'react';
import moment from 'moment';
import { capitalize } from 'lodash';
import { Grid } from '@material-ui/core';
import { visitsColumns, dateFormat } from '../../../constants';
import {
  NewButton, EditButton, TabHeader, ClientSideTable,
} from '../../../components';

const DiagnosisColumn = ({ diagnoses }) => (
  <Grid container direction="column" alignItems="center">
    {diagnoses.map(({ diagnosis: { name } }) => (
      <Grid item>{name}</Grid>
    ))}
  </Grid>
);

export default class Visits extends Component {
  state = {
    visits: [],
    tableColumns: visitsColumns,
  };

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  setActionsCol = ({ original: { _id } }) => {
    const { patientModel } = this.props;
    return (
      <EditButton
        to={`/patients/visit/${patientModel.id}/${_id}`}
        size="small"
        can={{ do: 'update', on: 'visit' }}
      />
    );
  }

  handleChange(props = this.props) {
    const { patient } = props;
    const { tableColumns } = this.state;
    const visits = patient.visits.map(visit => {
      let {
        startDate, endDate, visitType, diagnoses,
      } = visit;
      if (startDate) startDate = moment(startDate).format(`${dateFormat}`);
      if (endDate) endDate = moment(endDate).format(`${dateFormat}`);
      visitType = capitalize(visitType);
      return {
        ...visit,
        startDate,
        endDate,
        visitType,
        diagnosis: <DiagnosisColumn diagnoses={diagnoses} />,
      };
    });
    // Add actions column for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ visits, tableColumns });
  }

  render() {
    const { patientModel } = this.props;
    const { visits, tableColumns } = this.state;
    return (
      <Grid container>
        <TabHeader>
          <NewButton
            className="is-pulled-right"
            to={`/patients/visit/${patientModel.id}`}
            can={{ do: 'create', on: 'visit' }}
          >
            New Visit
          </NewButton>
        </TabHeader>
        <Grid container item>
          <ClientSideTable
            data={visits}
            columns={tableColumns}
            emptyNotification="No visits found."
          />
        </Grid>
      </Grid>
    );
  }
}
