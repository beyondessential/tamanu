import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Typography, Grid } from '@material-ui/core';
import { clone } from 'lodash';
import moment from 'moment';
import {
  Colors, surveyResponsesColumns, dateFormat, timeFormat,
  MUI_SPACING_UNIT as spacing,
} from '../../constants';
import actions from '../../actions/programs';
import {
  Preloader, BackButton, Button, TopBar, Container, SimpleTable,
} from '../../components';

const { responses: responseActions } = actions;
const { initResponses } = responseActions;

class Responses extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    patient: {},
    survey: {},
    program: {},
    headers: [],
    responses: [],
  }

  componentDidMount() {
    const {
      patientId, programId, surveyId, moduleId,
    } = this.props.match.params;
    this.props.initResponses({
      patientId, programId, surveyId, moduleId,
    });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  getHeaderColumns() {
    const { headers } = this.state;
    const tableHeaders = clone(surveyResponsesColumns);
    headers.forEach((header, key) => {
      tableHeaders.splice(key + 1, 0, {
        accessor: header._id,
        Header: header.text,
        headerStyle: {
          backgroundColor: Colors.searchTintColor,
        },
        style: {
          backgroundColor: Colors.white,
          height: '60px',
          color: '#2f4358',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        minWidth: 100,
      });
    });
    return tableHeaders;
  }

  getDataColumns() {
    const { responses } = this.state;
    const rows = [];
    responses.forEach(response => {
      const columns = [];
      const answers = response.get('answers').toJSON();
      answers.forEach(answer => { columns[answer.questionId] = answer.body; });
      columns.date = moment(response.attributes.startTime).format(`${dateFormat} ${timeFormat}`);
      columns.actions = this.setActionsCol(response.toJSON());
      rows.push(columns);
    });
    return rows;
  }

  setActionsCol(row) {
    const _this = this;
    return (
      <div key={row._id}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => _this.viewResponse(row._id)}
        >
          View Form
        </Button>
      </div>
    );
  }

  startSurvey = () => {
    const { patientId, programId, surveyId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys/${surveyId}`);
  }

  viewResponse(responseId) {
    const { programId, patientId, surveyId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/${surveyId}/responses/${responseId}`);
  }

  goBack() {
    const { patientId, programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  async handleChange(props = this.props) {
    const {
      survey: surveyModel,
      program: programModel,
      patient: patientModel,
      responses,
      loading,
    } = props;

    if (!loading) {
      this.setState({
        survey: surveyModel.toJSON(),
        program: programModel.toJSON(),
        patient: patientModel.toJSON(),
        headers: surveyModel.getHeaders(),
        responses,
      });
    }
  }

  render() {
    const { loading } = this.props;
    if (loading) return <Preloader />;

    const { survey, program, patient } = this.state;
    return (
      <React.Fragment>
        <TopBar
          title={program.name}
          buttons={{
            text: 'Add New',
            style: { marginRight: spacing },
            onClick: this.startSurvey,
          }}
          subTitle={survey.name}
        />
        <Container>
          <Grid container spacing={spacing * 2} direction="column">
            <Grid container item spacing={spacing}>
              <Grid item>
                <Typography variant="subtitle1">
                  Patient:
                </Typography>
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
                  {`${patient.firstName} ${patient.lastName}`}
                </Typography>
              </Grid>
            </Grid>
            <Grid item>
              <SimpleTable
                data={this.getDataColumns()}
                columns={this.getHeaderColumns()}
              />
            </Grid>
            <Grid item>
              <BackButton />
            </Grid>
          </Grid>
        </Container>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const {
    patient, program, survey, responses, loading,
  } = state.programs;
  return {
    patient, program, survey, responses, loading,
  };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initResponses: (params) => dispatch(initResponses(params)),
});
export default connect(mapStateToProps, mapDispatchToProps)(Responses);
