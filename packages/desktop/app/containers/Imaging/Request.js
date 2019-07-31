import React, { Component } from 'react';
import { remote as electron } from 'electron';
import fs from 'fs-jetpack';
import request from 'request';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import { capitalize } from 'lodash';
import styled from 'styled-components';
import * as imagingRequestActions from '../../actions/imaging';
import TopRow from '../Patients/components/TopRow';
import {
  TopBar, PatientAutocompleteField, TextField, PatientVisitSelectField,
  AddButton, UpdateButton, BackButton, SelectField,
  Button, Preloader, Container, FormRow, ButtonGroup, Form, Field,
} from '../../components';
import { IMAGING_REQUEST_STATUSES, MUI_SPACING_UNIT as spacing } from '../../constants';
import { PatientModel } from '../../models';

const { dialog, shell } = electron;
const ViewImageButton = styled(Button)`
  float: left;
`;

class Request extends Component {
  state = {
    isLoading: true,
  };

  componentDidMount() {
    this.props.initImagingRequest();
  }

  componentWillReceiveProps(newProps) {
    const { isLoading } = newProps;
    if (!isLoading) this.setState({ isLoading });
  }

  handlePatientChange = handleChange => event => {
    const { value } = event.target;
    handleChange(event);
    this.props.initImagingRequest({ patientId: value });
  }

  submitForm = (values, { setSubmitting }) => {
    const { imagingRequestModel, action } = this.props;
    imagingRequestModel.set(values);
    this.props.saveImagingRequest({ imagingRequestModel, action, setSubmitting });
  }

  markAsCompleted = ({ setFieldValue, submitForm }) => () => {
    setFieldValue('status', IMAGING_REQUEST_STATUSES.COMPLETED);
    submitForm();
  }

  viewImage = () => {
    const { _id: requestId } = this.state;
    const imageUrl = 'http://192.168.43.109:8080/weasis-pacs-connector/IHEInvokeImageDisplay?requestType=STUDY&studyUID=1.113654.3.13.1026';
    const filePath = dialog.showSaveDialog({
      title: 'Save Imaging',
      defaultPath: `imaging-${requestId}.jnlp`,
    });
    if (filePath) {
      request(imageUrl).pipe(fs.createWriteStream(filePath))
        .on('close', () => {
          shell.openItem(filePath);
        });
    }
  }

  render() {
    const {
      action, patientModel, isPatientSelected, imagingTypes, imagingRequestModel,
    } = this.props;
    const { isLoading } = this.state;
    if (isLoading) return <Preloader />;

    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} Imaging Request`} />
        <Container>
          {isPatientSelected
            && <TopRow patient={patientModel.toJSON()} />
          }
          <Form
            onSubmit={this.submitForm}
            initialValues={imagingRequestModel.toJSON()}
            validationSchema={imagingRequestModel.validationSchema()}
            render={({
              isSubmitting, handleChange, values, ...formActions
            }) => (
              <Grid container spacing={spacing * 2} direction="column">
                <FormRow>
                  {!isPatientSelected
                    && (
                      <Field
                        component={PatientAutocompleteField}
                        label="Patient"
                        name="patient"
                        onChange={this.handlePatientChange(handleChange)}
                        required
                      />
                    )
                  }
                  <Field
                    component={PatientVisitSelectField}
                    patientModel={patientModel}
                    name="visit"
                  />
                </FormRow>
                <FormRow>
                  <Field
                    component={SelectField}
                    label="Type"
                    name="type._id"
                    options={imagingTypes}
                    className="column"
                  />
                  <Field
                    component={TextField}
                    label="Location"
                    name="location"
                  />
                </FormRow>
                <FormRow>
                  <Field
                    component={TextField}
                    label="Notes"
                    name="notes"
                    rows="2"
                    multiline
                  />
                </FormRow>
                <Grid container item justify="flex-end">
                  <ButtonGroup>
                    {values.status === IMAGING_REQUEST_STATUSES.COMPLETED
                      && (
                      <ViewImageButton
                        color="secondary"
                        variant="contained"
                        onClick={this.viewImage}
                      >
                        View Image
                      </ViewImageButton>
                      )
                    }
                    <BackButton />
                    {action === 'new'
                      ? (
                        <AddButton
                          type="submit"
                          isSubmitting={isSubmitting}
                          can={{ do: 'create', on: 'imaging' }}
                        />
                      )
                      : (
                        <React.Fragment>
                          <Button
                            color="secondary"
                            variant="contained"
                            can={{ do: 'update', on: 'imaging', field: 'status' }}
                            onClick={this.markAsCompleted(formActions)}
                            isSubmitting={isSubmitting}
                            disabled={values.status === IMAGING_REQUEST_STATUSES.COMPLETED}
                          >
                            {values.status !== IMAGING_REQUEST_STATUSES.COMPLETED ? 'Mark as Completed' : 'Completed'}
                          </Button>
                          <UpdateButton
                            type="submit"
                            isSubmitting={isSubmitting}
                            disabled={values.status === IMAGING_REQUEST_STATUSES.COMPLETED}
                            can={{ do: 'update', on: 'imaging' }}
                          />
                        </React.Fragment>
                      )
                    }
                  </ButtonGroup>
                </Grid>
              </Grid>
            )}
          />
        </Container>
      </React.Fragment>
    );
  }
}

Request.propTypes = {
  initImagingRequest: PropTypes.func.isRequired,
  saveImagingRequest: PropTypes.func.isRequired,
  markImagingRequestCompleted: PropTypes.func.isRequired,
  patient: PropTypes.instanceOf(Object),
  imagingTypes: PropTypes.arrayOf(PropTypes.object),
  imagingRequestModel: PropTypes.instanceOf(Object).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

Request.defaultProps = {
  patient: new PatientModel(),
  imagingTypes: [],
  isLoading: true,
  error: {},
};

function mapStateToProps({
  imaging: {
    patient, imagingTypes, isLoading, error, imagingRequestModel,
  },
},
{ match: { params: { patientId, id } = {} } }) {
  return {
    patientModel: patient,
    imagingTypes,
    isLoading,
    imagingRequestModel,
    error,
    isPatientSelected: !!patientId,
    action: id ? 'edit' : 'new',
  };
}

const {
  initImagingRequest, saveImagingRequest, markImagingRequestCompleted,
} = imagingRequestActions;
const mapDispatchToProps = (
  dispatch,
  { match: { params: { patientId, id } = {} } },
) => ({
  initImagingRequest: (props) => dispatch(initImagingRequest({ patientId, id, ...props })),
  saveImagingRequest: (params) => dispatch(saveImagingRequest(params)),
  markImagingRequestCompleted: (params) => dispatch(markImagingRequestCompleted(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Request);
