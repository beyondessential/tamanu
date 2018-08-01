import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isEmpty, clone } from 'lodash';
import moment from 'moment';
import ReactTable from 'react-table';
import { Colors, pageSizes, surveyResponsesColumns, dateFormat, timeFormat } from '../../constants';
import actions from '../../actions/programs';
import Preloader from '../../components/Preloader';

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
    const { patientId, programId, surveyId } = this.props.match.params;
    this.props.initResponses({ patientId, programId, surveyId });
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
      responses,
      loading
    } = props;

    if (!loading) {
      this.setState({
        survey: surveyModel.toJSON(),
        program: programModel.toJSON(),
        patient: patientModel.toJSON(),
        headers: surveyModel.getHeaders(),
        responses
      });
    }
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
          justifyContent: 'center'
        },
        minWidth: 100
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
        <button className="button is-primary is-outlined" onClick={() => _this.viewResponse(row._id)}>View Form</button>
      </div>
    );
  }

  viewResponse(responseId) {
    const { programId, patientId, surveyId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/${surveyId}/responses/${responseId}`);
  }

  goBack() {
    const { patientId, programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  startSurvey = () => {
    const { patientId, programId, surveyId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys/${surveyId}`);
  }

  render() {
    const { loading } = this.props;
    if (loading) return <Preloader />;

    const { survey, program, patient } = this.state;
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>{program.name}</span>
          <span className="tag is-info survey-title">{survey.name}</span>
        </div>
        <div className="survey-details details">
          <div className="pregnancy-top m-b-10">
            <div className="columns">
              <div className="column pregnancy-name is-pulled-left">
                <span className="has-text-weight-normal is-size-6">
                  Patient
                </span>
                <span className="has-text-weight-bold is-size-5 p-l-10">
                  {`${patient.firstName} ${patient.lastName}`}
                </span>
              </div>
              <div className="column pregnancy-name is-pulled-right">
                <button className="button is-primary is-pulled-right" onClick={this.startSurvey.bind(this)}>
                  <i className="fa fa-plus p-r-5" /> Add new
                </button>
              </div>
            </div>
            {/* <div className="columns">
              <div className="column pregnancy-name">
                <span className="pregnancy-name-tit1le">
                  Patient
                </span>
                <span className="pregnancy-name-details">
                  {`${patient.firstName} ${patient.lastName}`}
                </span>
              </div>
            </div> */}
          </div>
          <ReactTable
            manual
            keyField="_id"
            data={this.getDataColumns()}
            // pages={this.props.collection.totalPages}
            defaultPageSize={pageSizes.surveyResponses}
            loading={this.state.loading}
            columns={this.getHeaderColumns()}
            className="-striped"
          // onFetchData={this.onFetchData}
          />
          <div className="question-table-buttons p-t-20">
            <button className="button is-danger question-table-button" onClick={this.goBack.bind(this)}>
              <i className="fa fa-chevron-left" /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, program, survey, responses, loading } = state.programs;
  return { patient, program, survey, responses, loading };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initResponses: (params) => dispatch(initResponses(params)),
});
export default connect(mapStateToProps, mapDispatchToProps)(Responses);
