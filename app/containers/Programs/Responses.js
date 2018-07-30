import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';
import { Colors, pageSizes } from '../../constants';
import actions from '../../actions/programs';
import Preloader from '../../components/Preloader';

const { surveys: surveysActions } = actions;
const { initSurveys } = surveysActions;

class Responses extends Component {
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
          <div className="pregnancy-top m-b-20">
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
          {/* <ReactTable
            manual
            keyField="_id"
            data={questionTable}
            // pages={this.props.collection.totalPages}
            defaultPageSize={5}
            // loading={this.state.loading}
            columns={questionTableColumns}
            className="-striped"
            defaultSortDirection="asc"
          // onFetchData={this.onFetchData}
          /> */}
          <div className="question-table-buttons">
            <button className="button is-primary question-table-button">Gestational diabetes</button>
            <button className="button is-danger question-table-button">Finish Visit</button>
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
export default connect(mapStateToProps, mapDispatchToProps)(Responses);
