import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Grid, Typography } from '@material-ui/core';
import { MUI_SPACING_UNIT as spacing } from '../../constants';
import actions from '../../actions/programs';
import QuestionScreen from './Survey/QuestionScreen';
import {
  BackButton, Preloader, TopBar, Container, DateDisplay,
} from '../../components';

const { response: responseActions } = actions;
const { initResponse } = responseActions;

class Response extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    patient: {},
    survey: {},
    program: {},
    response: [],
    loading: true,
  }

  componentWillMount() {
    const {
      patientId, programId, surveyId, responseId,
    } = this.props.match.params;
    this.props.initResponse({
      patientId, programId, surveyId, responseId,
    });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  setActionsCol(row) {
    const _this = this;
    return (
      <div key={row._id}>
        <button className="button is-primary is-outlined column-button" onClick={() => _this.selectPatient(row.value._id)}>View Form</button>
      </div>
    );
  }

  gotoSurvey = (surveyId) => {
    const { patientId, programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys/${surveyId}`);
  }

  async handleChange(props = this.props) {
    const {
      survey: surveyModel,
      program: programModel,
      patient: patientModel,
      response,
      loading,
    } = props;

    if (!loading) {
      const { answers } = response.attributes;
      this.setState({
        survey: surveyModel.toJSON(),
        program: programModel.toJSON(),
        patient: patientModel.toJSON(),
        response: response.toJSON(),
        answers: answers.toJSON(),
        loading,
      });
    }
  }

  viewCompleted(listing, surveyId, responseId) {
    const { patientId } = this.props.match.params;
    const url = listing ? `/programs/${patientId}/${surveyId}/responses` : `/programs/${patientId}/${surveyId}/response/${responseId}`;
    this.props.history.push(url);
  }

  goBack() {
    const { patientId, programId, surveyId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/${surveyId}/responses`);
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />;

    const {
      survey, program, patient, response, answers,
    } = this.state;
    return (
      <React.Fragment>
        <TopBar
          title={program.name}
          subTitle={survey.name}
        />
        <Container>
          <Grid container>
            <Grid container item spacing={spacing} xs>
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
            <Grid container item spacing={spacing} xs>
              <Grid item>
                <Typography variant="subtitle1">
                  Date Submitted:
                </Typography>
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
                  <DateDisplay date={response.endTime} />
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={spacing * 2}
            direction="column"
            style={{ marginTop: spacing * 3 }}
          >
            {survey.screens.map((screen, index) => (
              <QuestionScreen
                key={screen.screenNumber}
                surveyModel={this.props.survey}
                screenIndex={index}
                answers={answers}
                readOnly
              />
            ))}
          </Grid>

          <Grid
            container
            item
            style={{ marginTop: spacing * 3 }}
          >
            <BackButton />
          </Grid>
        </Container>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const {
    patient, program, survey, response, loading,
  } = state.programs;
  return {
    patient, program, survey, response, loading,
  };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initResponse: (params) => dispatch(initResponse(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Response);
