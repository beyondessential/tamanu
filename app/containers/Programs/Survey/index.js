import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { clone } from 'lodash';
import { connect } from 'react-redux';

import Preloader from '../../../components/Preloader';
import { initSurvey } from '../../../actions/programs';
import QuestionScreen from './QuestionScreen';

class Survey extends Component {
  componentDidMount() {
    console.log('componentDidMount', this.props);
    const { patientId, programId, surveyId } = this.props.match.params;
    this.props.initSurvey({ patientId, programId, surveyId });
  }

  componentWillReceiveProps(newProps) {
    console.log('componentWillReceiveProps', newProps);
  }

  render() {
    const { loading } = this.props;
    if (loading) return <Preloader />;

    const {
      patient,
      program: programModel,
      survey: surveyModel,
      currentScreenIndex
    } = this.props;
    const program = programModel.toJSON();
    const survey = surveyModel.toJSON();

    return (
      <div className="content">
        <div className="view-top-bar">
          <span>{program.name}</span>
          <span className="tag is-info survey-title">{survey.name}</span>
        </div>
        <div className="questionsFirst-details">
          <QuestionScreen model={surveyModel} screenIndex={currentScreenIndex} />
          <div className="bottom-buttons">
            <button className="button is-danger question-finish-button">Cancel</button>
            <button className="button is-primary question-outcomes-button">Confirm</button>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, survey, program, currentScreenIndex, loading } = state.programs;
  return { patient, survey, program, currentScreenIndex, loading };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initSurvey: (model) => dispatch(initSurvey(model))
});

export default connect(mapStateToProps, mapDispatchToProps)(Survey);
