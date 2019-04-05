import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Grid, Typography } from '@material-ui/core';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';
import {
  Dialog, Preloader, Button, TopBar, Container, ButtonGroup,
} from '../../../components';
import actions from '../../../actions/programs';
import QuestionScreen from './QuestionScreen';

const { survey: surveyActions } = actions;
const { initSurvey, submitSurvey } = surveyActions;

class Survey extends Component {
  state = {
    currentScreenIndex: 0,
    cancelSurveyModalVisible: false,
    submitSurveyModalVisible: false,
    loading: true,
  }

  componentDidMount() {
    const { patientId, programId, surveyId } = this.props.match.params;
    this.props.initSurvey({ patientId, programId, surveyId });
  }

  componentWillReceiveProps(newProps) {
    const {
      currentScreenIndex, survey: surveyModel, program: programModel, loading,
    } = newProps;
    const program = programModel.toJSON();
    const survey = surveyModel.toJSON();
    const totalScreens = surveyModel.getTotalScreens();
    this.setState({
      currentScreenIndex, totalScreens, program, survey, loading,
    });
  }

  submitSurvey = () => {
    const { patient: patientModel, history } = this.props;
    const { programId, surveyId, moduleId } = this.props.match.params;
    this.props.submitSurvey({
      patientModel, programId, surveyId, moduleId, history,
    });
  }

  cancelSurvey = () => {
    const { patientId, programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  buttonPrevClick = () => {
    let { currentScreenIndex } = this.state;
    if (currentScreenIndex > 0) { // Prev
      currentScreenIndex -= 1;
      this.setState({ currentScreenIndex });
    } else { // Cancel
      this.setState({ cancelSurveyModalVisible: true });
    }
  }

  buttonNextClick = () => {
    let { currentScreenIndex } = this.state;
    const { totalScreens } = this.state;
    if (currentScreenIndex < (totalScreens - 1)) {
      currentScreenIndex += 1;
      this.setState({ currentScreenIndex });
    } else {
      this.setState({ submitSurveyModalVisible: true });
    }
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />;

    const {
      currentScreenIndex, totalScreens, program, survey,
    } = this.state;
    const isFirstScreen = (currentScreenIndex === 0);
    const isLastScreen = (currentScreenIndex === (totalScreens - 1));
    return (
      <Fragment>
        <TopBar title={`${survey.name} - ${program.name}`}>
          <Typography variant="subheading">
            {`Step ${currentScreenIndex + 1} of ${totalScreens}`}
          </Typography>
        </TopBar>
        <Container>
          <QuestionScreen
            surveyModel={this.props.survey}
            screenIndex={currentScreenIndex}
          />
          <Grid
            container
            item
            justify="flex-end"
            style={{ paddingTop: spacing * 2 }}
          >
            <ButtonGroup>
              <Button
                variant="outlined"
                onClick={this.buttonPrevClick}
              >
                {isFirstScreen ? 'Cancel' : 'Previous'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={this.buttonNextClick}
              >
                {isLastScreen ? 'Submit' : 'Next'}
              </Button>
            </ButtonGroup>
          </Grid>
        </Container>

        <Dialog
          dialogType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to cancel this survey?"
          isVisible={this.state.cancelSurveyModalVisible}
          onConfirm={this.cancelSurvey}
          onClose={() => this.setState({ cancelSurveyModalVisible: false })}
        />
        <Dialog
          dialogType="confirm"
          headerTitle="Submit your survey"
          contentText="You are now ready to submit your answers. Once submitted, your survey answers will be synced automatically."
          isVisible={this.state.submitSurveyModalVisible}
          onConfirm={this.submitSurvey}
          onClose={() => this.setState({ submitSurveyModalVisible: false })}
          okText="Submit"
        />
      </Fragment>
    );
  }
}

function mapStateToProps(state) {
  const {
    patient, survey, program, currentScreenIndex, loading,
  } = state.programs;
  return {
    patient, survey, program, currentScreenIndex, loading,
  };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initSurvey: (patientId, programId, surveyId) => dispatch(initSurvey(patientId, programId, surveyId)),
  submitSurvey: (patientModel, programId, surveyId, history) => dispatch(submitSurvey(patientModel, programId, surveyId, history)),
});
// , questions, startTime
export default connect(mapStateToProps, mapDispatchToProps)(Survey);
