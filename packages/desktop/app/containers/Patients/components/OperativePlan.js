import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import { TextButton } from '../../../components';
import { PatientModel } from '../../../models';

function OperativePlan({ patientModel }) {
  const operationPlan = patientModel.getOpenPlan();
  return (
    <Grid container item spacing={8}>
      <Grid item>
        <Typography variant="body2" inline>
          Operative Plan
        </Typography>
      </Grid>
      <Grid item>
        {!operationPlan
          && (
            <TextButton
              can={{ do: 'create', on: 'operativePlan' }}
              to={`/patients/operativePlan/${patientModel.id}`}
            >
              + Add Operative Plan
            </TextButton>
          )
        }
      </Grid>
      {operationPlan
        && (
          <TextButton
            can={{ do: 'read', on: 'operativePlan' }}
            to={`/patients/operativePlan/${patientModel.id}/${operationPlan._id}`}
          >
            Current Operative Plan
          </TextButton>
        )
      }
    </Grid>
  );
}

OperativePlan.propTypes = {
  patientModel: PropTypes.instanceOf(PatientModel).isRequired,
};

export default OperativePlan;
