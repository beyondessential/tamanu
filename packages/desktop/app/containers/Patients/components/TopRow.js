import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Grid, Typography, Chip } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { getDifferenceDate } from '../../../constants';
import { Container } from '../../../components';

const styles = ({ spacing }) => ({
  container: {
    position: 'relative',
  },
  chip: {
    position: 'absolute',
    top: spacing.unit / 2,
    right: 0,
    padding: spacing.unit / 2,
  },
});

const RenderRow = ({ label, value }) => (
  <Grid container item alignItems="center" spacing={8}>
    <Grid item>
      <Typography variant="body2">
        {`${label}:`}
      </Typography>
    </Grid>
    <Grid item>
      <Typography variant="body1">
        {value}
      </Typography>
    </Grid>
  </Grid>
);

function TopRow({ classes, patient }) {
  return (
    <Container>
      <Grid
        container
        spacing={8}
        direction="row"
        className={classes.container}
      >
        <Chip
          className={classes.chip}
          label={patient.displayId}
        />
        <RenderRow
          label="Name"
          value={patient.displayName}
        />
        <RenderRow
          label="Sex"
          value={patient.sex}
        />
        <RenderRow
          label="Age"
          value={getDifferenceDate(moment(), patient.dateOfBirth)}
        />
      </Grid>
    </Container>
  );
}

TopRow.propTypes = {
  patient: PropTypes.instanceOf(Object).isRequired,
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withStyles(styles)(TopRow);
