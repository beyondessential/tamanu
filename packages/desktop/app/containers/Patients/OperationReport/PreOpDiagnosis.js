import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import moment from 'moment';
import { dateFormat, MUI_SPACING_UNIT as spacing } from '../../../constants';

export default function PreOpDiagnosis({ operationReportModel }) {
  const diagnoses = operationReportModel.get('preOpDiagnoses');
  if (diagnoses.length === 0) return null;
  return (
    <Grid container direction="column" style={{ marginBottom: spacing * 2 }}>
      <Grid item>
        <Typography variant="body2">Pre Op Diagnosis</Typography>
      </Grid>
      <Grid item style={{ paddingTop: 0 }}>
        {diagnoses.map((diagnosis, k) => {
          const { diagnosis: { name: diagnosisName = '' } = {} } = diagnosis.toJSON();
          return (
            <React.Fragment key={diagnosis._id}>
              {k > 0 ? ', ' : ''}
              {`${diagnosisName} (${moment(diagnosis.date).format(dateFormat)})`}
            </React.Fragment>
          );
        })}
      </Grid>
    </Grid>
  );
}
