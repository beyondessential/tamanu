import React, { Component } from 'react';
import { connect } from 'react-redux';
import { capitalize } from 'lodash';
import { Grid, Typography, ListItem } from '@material-ui/core';
import { MUI_SPACING_UNIT as spacing } from '../../constants';
import actions from '../../actions/programs';
import { Preloader, Dialog, TopBar, Container, SelectInput, BackButton } from '../../components';

const { surveys: surveysActions } = actions;
const { initSurveys, getCompletedSurveys } = surveysActions;

class Surveys extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.selectModule = this.selectModule.bind(this);
  }

  state = {
    patient: {},
    program: {},
    availableSurveys: [],
    completedSurveys: [],
    modules: [],
    moduleSelectedValue: '',
    showMessage: false,
    message: {
      header: '',
      text: '',
    },
  };

  componentDidMount() {
    const { patientId, programId, moduleId } = this.props.match.params;
    this.props.initSurveys({ patientId, programId, moduleId });
    if (moduleId) this.setState({ moduleSelectedValue: moduleId });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  onCloseModal = () => {
    const showMessage = false;
    this.setState({ showMessage });
  };

  selectModule = event => {
    const { program } = this.state;
    const { value } = event.target;
    this.props.getCompletedSurveys({
      moduleType: program.programType,
      moduleId: value,
    });
    this.setState({ moduleSelectedValue: value });
  };

  gotoSurvey = surveyId => {
    const { patientId, programId } = this.props.match.params;
    const { program, moduleSelectedValue } = this.state;
    let valid = true;
    if (program.programType !== 'direct' && moduleSelectedValue === '') {
      valid = false;
      const message = {
        header: `${capitalize(program.programType)} is required!`,
        text: capitalize(`Please select a ${program.programType} first`),
      };
      this.setState({ showMessage: true, message });
    }
    if (valid) {
      const url =
        program.programType === 'direct'
          ? `/programs/${programId}/${patientId}/surveys/${surveyId}`
          : `/programs/${programId}/${patientId}/surveys/${surveyId}/module/${moduleSelectedValue}`;
      this.props.history.push(url);
    }
  };

  async handleChange(props = this.props) {
    const { moduleId } = this.props.match.params;
    const {
      patient: patientModel,
      program: programModel,
      availableSurveys,
      completedSurveys,
      modules,
      loading,
    } = props;

    if (!loading) {
      this.setState({
        patient: patientModel.toJSON(),
        program: programModel.toJSON(),
        availableSurveys,
        completedSurveys,
        modules,
      });
    }
  }

  viewCompleted(listing, surveyId, responseId) {
    const { patientId, programId } = this.props.match.params;
    const { moduleSelectedValue } = this.state;
    let url = '';
    if (listing) {
      url = moduleSelectedValue
        ? `/programs/${programId}/${patientId}/${surveyId}/${moduleSelectedValue}/responses`
        : `/programs/${programId}/${patientId}/${surveyId}/responses`;
    } else {
      url = `/programs/${patientId}/${surveyId}/response/${responseId}`;
    }
    this.props.history.push(url);
  }

  goBack() {
    const { programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/patients`);
  }

  render() {
    const { loading } = this.props;
    if (loading) return <Preloader />;

    const {
      patient,
      program,
      modules,
      moduleSelectedValue,
      availableSurveys,
      completedSurveys,
      showMessage,
      message,
    } = this.state;
    return (
      <React.Fragment>
        <TopBar title={program.name} />
        <Container>
          <Grid container>
            <Grid container item xs spacing={spacing}>
              <Grid item>
                <Typography variant="subtitle1">Patient:</Typography>
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
                  {`${patient.firstName} ${patient.lastName}`}
                </Typography>
              </Grid>
            </Grid>
            {program.programType !== 'direct' && (
              <Grid container item xs spacing={spacing}>
                <Grid item>
                  <Typography variant="subtitle1">{capitalize(program.programType)}</Typography>
                </Grid>
                <Grid item xs>
                  <SelectInput
                    options={modules}
                    name="moduleType"
                    value={moduleSelectedValue}
                    onChange={this.selectModule}
                    required
                  />
                </Grid>
              </Grid>
            )}
          </Grid>

          <Grid container style={{ marginTop: spacing * 5 }}>
            <Grid item xs>
              <Typography variant="h6">Forms available</Typography>
              {!availableSurveys.length && <div className="p-t-10">No forms available</div>}
              {availableSurveys.length > 0 &&
                availableSurveys.map(survey => (
                  <ListItem
                    button
                    onClick={() => this.gotoSurvey(survey._id)}
                    component="div"
                    key={survey._id}
                  >
                    {survey.name}
                  </ListItem>
                ))}
            </Grid>
            <Grid item xs>
              {completedSurveys.length > 0 && (
                <React.Fragment>
                  <Typography variant="h6">
                    Previously Submitted
                    {!moduleSelectedValue && ' - All'}
                  </Typography>
                  {completedSurveys.map(survey => (
                    <ListItem
                      button
                      onClick={() => this.viewCompleted(survey.canRedo, survey._id)}
                      component="div"
                      key={survey._id}
                    >
                      {`${survey.name} (${survey.count})`}
                    </ListItem>
                  ))}
                </React.Fragment>
              )}
            </Grid>
          </Grid>

          <Grid container item style={{ paddingTop: spacing * 3 }}>
            <BackButton />
          </Grid>
        </Container>
        <Dialog
          isVisible={showMessage}
          onClose={this.onCloseModal}
          headerTitle={message.header}
          contentText={message.text}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { patient, program, modules, availableSurveys, completedSurveys, loading } = state.programs;
  return {
    patient,
    program,
    modules,
    availableSurveys,
    completedSurveys,
    loading,
  };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initSurveys: model => dispatch(initSurveys(model)),
  getCompletedSurveys: props => dispatch(getCompletedSurveys(props)),
});
// , questions, startTime
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Surveys);
