import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';
import { Colors, pageSizes } from '../../constants';
import actions from '../../actions/programs';
import Preloader from '../../components/Preloader';

const { surveys: surveysActions } = actions;
const { initSurveys } = surveysActions;

class Surveys extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    patient: {},
    program: {},
    availableSurveys: [],
    completedSurveys: []
  }

  componentDidMount() {
    const { patientId, programId } = this.props.match.params;
    this.props.initSurveys({ patientId, programId });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  async handleChange(props = {}) {
    if (isEmpty(props)) props = this.props;
    const {
      patient: patientModel,
      program: programModel,
      availableSurveys,
      completedSurveys,
      loading
    } = props;

    if (!loading) {
      this.setState({
        patient: patientModel.toJSON(),
        program: programModel.toJSON(),
        availableSurveys,
        completedSurveys,
      });
    }
  }

  gotoSurvey = (surveyId) => {
    const { patientId, programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys/${surveyId}`);
  }

  viewCompleted(listing, surveyId, responseId) {
    const { patientId } = this.props.match.params;
    const url = listing ? `/programs/${patientId}/${surveyId}/responses` : `/programs/${patientId}/${surveyId}/response/${responseId}`;
    this.props.history.push(url);
  }

  render() {
    const { loading } = this.props;
    if (loading) return <Preloader />;

    const { patient, program, availableSurveys, completedSurveys } = this.state;
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>{program.name}</span>
        </div>
        <div className="details">
          <div className="pregnancy-top p-l-10">
            <div className="columns">
              <div className="column pregnancy-name">
                <span className="pregnancy-name-title">
                  Patient
                </span>
                <span className="pregnancy-name-details">
                  {`${patient.firstName} ${patient.lastName}`}
                </span>
              </div>
            </div>
          </div>
          <div className="columns">
            <div className="column pregnancy-button-details m-l-10">
              <div className="pregnancy-options-title">Options available</div>
              {availableSurveys.map(survey => {
                return (
                  <div className="button-details" key={survey._id}>
                    <button className="button is-primary pregnancies-button " onClick={() => this.gotoSurvey(survey._id)}>{survey.name}</button>
                  </div>
                );
              })}
            </div>
            <div className="column pregnancy-button-details">
              <div className="pregnancy-options-title">Previously Submitted</div>
              {completedSurveys.map(survey => {
                return (
                  <div className="button-details" key={survey._id}>
                    <button className="button is-info pregnancies-button " onClick={() => this.viewCompleted(survey.canRedo, survey._id)}>{survey.name}</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, program, availableSurveys, completedSurveys, loading } = state.programs;
  return { patient, program, availableSurveys, completedSurveys, loading };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initSurveys: (model) => dispatch(initSurveys(model)),
});
// , questions, startTime
export default connect(mapStateToProps, mapDispatchToProps)(Surveys);
