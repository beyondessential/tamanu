import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';

import ModalView from '../../../components/Modal';
import Preloader from '../../../components/Preloader';
import { initSurvey, submitSurvey } from '../../../actions/programs';
import QuestionScreen from './QuestionScreen';

class Survey extends Component {
  state = {
    currentScreenIndex: 0,
    cancelSurveyModalVisible: false,
    submitSurveyModalVisible: false,
  }

  componentDidMount() {
    const { patientId, programId, surveyId } = this.props.match.params;
    this.props.initSurvey({ patientId, programId, surveyId });
  }

  componentWillReceiveProps(newProps) {
    const { currentScreenIndex, survey: surveyModel } = newProps;
    const totalScreens = surveyModel.getTotalScreens();
    this.setState({ currentScreenIndex, totalScreens });
  }

  buttonPrevClick() {
    let { currentScreenIndex } = this.state;
    if (currentScreenIndex > 0) { // Prev
      currentScreenIndex -= 1;
      this.setState({ currentScreenIndex });
    } else { // Cancel
      this.setState({ cancelSurveyModalVisible: true });
    }
  }

  buttonNextClick() {
    let { currentScreenIndex } = this.state;
    const { totalScreens } = this.state;
    if (currentScreenIndex < (totalScreens - 1)) {
      currentScreenIndex += 1;
      this.setState({ currentScreenIndex });
    } else {
      this.setState({ submitSurveyModalVisible: true });
    }
  }

  cancelSurvey() {
    const { patientId, programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  render() {
    const { loading } = this.props;
    if (loading) return <Preloader />;

    const {
      program: programModel,
      survey: surveyModel,
    } = this.props;
    const { currentScreenIndex, totalScreens } = this.state;
    const program = programModel.toJSON();
    const survey = surveyModel.toJSON();

    return (
      <Fragment>
        <div className="content headerFixed">
          <div className="view-top-bar">
            <span>{program.name}</span>
            <span className="tag is-info survey-title">{survey.name}</span>
            <span className="tag is-white survey-steps m-r-10">{`Step ${currentScreenIndex + 1} of ${totalScreens}`}</span>
          </div>
          <div className="survey-details">
            <QuestionScreen model={surveyModel} screenIndex={currentScreenIndex} />
            <div className="bottom-buttons">
              <button className="button is-danger question-finish-button" onClick={this.buttonPrevClick.bind(this)}>{currentScreenIndex > 0 ? 'Prev' : 'Cancel'}</button>
              <button className="button is-primary question-outcomes-button" onClick={this.buttonNextClick.bind(this)}>{currentScreenIndex < (totalScreens - 1) ? 'Next' : 'Submit'}</button>
            </div>
          </div>
        </div>

        <ModalView
          modalType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to cancel this survey?"
          isVisible={this.state.cancelSurveyModalVisible}
          onConfirm={this.cancelSurvey.bind(this)}
          onClose={() => this.setState({ cancelSurveyModalVisible: false })}
        />

        <ModalView
          modalType="confirm"
          headerTitle="Submit your survey"
          contentText="You are now ready to submit your answers. Once submitted, your survey answers will be synced automatically."
          isVisible={this.state.submitSurveyModalVisible}
          onConfirm={this.props.submitSurvey.bind(this)}
          onClose={() => this.setState({ submitSurveyModalVisible: false })}
          okText="Submit"
        />
      </Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { answers, patient, survey, program, currentScreenIndex, loading } = state.programs;
  return { patient, survey, program, currentScreenIndex, loading };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initSurvey: (model) => dispatch(initSurvey(model)),
  submitSurvey: () => {
    const { patientId, programId, surveyId } = ownProps.match.params;
    const { history } = ownProps;
    dispatch(submitSurvey(patientId, surveyId, programId, history));
  },
});
// , questions, startTime
export default connect(mapStateToProps, mapDispatchToProps)(Survey);
