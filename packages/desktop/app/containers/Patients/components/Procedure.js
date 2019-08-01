import React, { Component } from 'react';
import { Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import { TextButton } from '../../../components';
import { PatientModel } from '../../../models';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';

export default class Procedure extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
  };

  state = {
    procedures: [],
  };

  componentWillMount() {
    const { patientModel } = this.props;
    const procedures = patientModel.getProcedures();
    this.setState({ procedures });
  }

  componentWillReceiveProps(newProps) {
    const { patientModel } = newProps;
    const procedures = patientModel.getProcedures();
    this.setState({ procedures });
  }

  render() {
    const { patientModel } = this.props;
    const { procedures } = this.state;
    if (!procedures.length) return null;
    return (
      <React.Fragment>
        <Grid container item style={{ paddingRight: spacing }}>
          <Typography variant="body2">Procedures</Typography>
        </Grid>
        <Grid container item xs={12} style={{ paddingTop: 0 }}>
          {procedures.map((procedure, k) => (
            <React.Fragment key={procedure._id}>
              {k > 0 ? ', ' : ''}
              <TextButton
                can={{ do: 'create', on: 'procedure' }}
                to={`/patients/operationReport/${patientModel.id}/${procedure.operationReportId}`}
              >
                {`${procedure.name} (${procedure.date})`}
              </TextButton>
            </React.Fragment>
          ))}
        </Grid>
      </React.Fragment>
    );
  }
}
