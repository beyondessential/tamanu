import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isEmpty, clone } from 'lodash';
import moment from 'moment';
import ReactTable from 'react-table';
import { Colors, pageSizes, dateFormat, timeFormat } from '../../constants';
import actions from '../../actions/programs';
import Preloader from '../../components/Preloader';
import QuestionScreen from './Survey/QuestionScreen';

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
    const { patientId, programId, surveyId, responseId } = this.props.match.params;
    this.props.initResponse({ patientId, programId, surveyId, responseId });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  async handleChange(props = {}) {
    if (isEmpty(props)) props = this.props;
    const {
      survey: surveyModel,
      program: programModel,
      patient: patientModel,
      response,
      loading
    } = props;

    if (!loading) {
      const { answers } = response.attributes;
      this.setState({
        survey: surveyModel.toJSON(),
        program: programModel.toJSON(),
        patient: patientModel.toJSON(),
        response: response.toJSON(),
        answers: answers.toJSON(),
        loading
      });
    }
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

    const { survey, program, patient, response, answers } = this.state;
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>{program.name}</span>
          <span className="tag is-info survey-title">{survey.name}</span>
        </div>
        <div className="survey-details details">
          <div className="pregnancy-top m-b-10">
            <div className="columns m-b-20">
              <div className="column pregnancy-name is-pulled-left">
                <span className="has-text-weight-normal is-size-6">
                  Patient
                </span>
                <span className="has-text-weight-bold is-size-5 p-l-10">
                  {`${patient.firstName} ${patient.lastName}`}
                </span>
              </div>
              <div className="column pregnancy-name is-pulled-right">
                <span className="has-text-weight-normal is-size-6">
                  Date Submitted
                </span>
                <span className="has-text-weight-bold is-size-6 p-l-10 p-t-5 is-inline-block">
                  {`${moment(response.endTime).format(dateFormat)} ${moment(response.endTime).format(timeFormat)}`}
                </span>
              </div>
            </div>
            {survey.screens.map((screen, index) => (
              <QuestionScreen key={`${survey._id}-${index}`} model={this.props.survey} screenIndex={index} answers={answers} readOnly />
            ))}
          </div>
          <div className="question-table-buttons p-t-15">
            <button className="button is-danger question-table-button" onClick={this.goBack.bind(this)}>Back</button>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, program, survey, response, loading } = state.programs;
  return { patient, program, survey, response, loading };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initResponse: (params) => dispatch(initResponse(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Response);
