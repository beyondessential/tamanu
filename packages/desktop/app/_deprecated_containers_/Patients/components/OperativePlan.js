import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import { TextButton } from '../../../components';
import { PatientModel, VisitModel } from '../../../models';

export default function OperativePlan({ parentModel, patientId }) {
  const operativePlan = parentModel.getCurrentOperativePlan();
  return (
    <Grid container item spacing={8}>
      <Grid item>
        <Typography variant="body2">Operative Plan</Typography>
      </Grid>
      <Grid item>
        {!operativePlan && (
          <TextButton
            can={{ do: 'create', on: 'operativePlan' }}
            to={`/patients/patient:${patientId}/visit/operativePlan`}
          >
            + Add Operative Plan
          </TextButton>
        )}
      </Grid>
      {operativePlan && (
        <TextButton
          can={{ do: 'read', on: 'operativePlan' }}
          to={`/patients/patient:${patientId}/visit/operativePlan:${operativePlan.id}`}
        >
          Current Operative Plan
        </TextButton>
      )}
    </Grid>
  );
}

OperativePlan.propTypes = {
  parentModel: PropTypes.oneOfType([
    PropTypes.instanceOf(PatientModel),
    PropTypes.instanceOf(VisitModel),
  ]).isRequired,
  patientId: PropTypes.string.isRequired,
};
