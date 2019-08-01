import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Grid, Typography } from '@material-ui/core';
import { dateFormat } from '../../../constants';
import { TextButton } from '../../../components';
import { PatientModel, VisitModel } from '../../../models';

export default function OperationReport({ parentModel, patientId }) {
  const operationReports = parentModel.getOperationReports();
  return (
    <Grid container item spacing={8}>
      <Grid item>
        <Typography variant="body2">Operation Reports</Typography>
      </Grid>
      {operationReports.map((operationReportModel, k) => (
        <React.Fragment key={operationReportModel.id}>
          {k > 0 ? ', ' : ''}
          <TextButton
            can={{ do: 'read', on: 'operationReport' }}
            to={`/patients/patient:${patientId}/visit/operationReport:${operationReportModel.id}`}
          >
            {moment(operationReportModel.get('createdAt')).format(dateFormat)}
          </TextButton>
        </React.Fragment>
      ))}
    </Grid>
  );
}

OperationReport.propTypes = {
  parentModel: PropTypes.oneOfType([
    PropTypes.instanceOf(PatientModel),
    PropTypes.instanceOf(VisitModel),
  ]).isRequired,
  patientId: PropTypes.string.isRequired,
};
