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
  TopBar, PatientAutocomplete, PatientRelationSelect, TextInput,
  AddButton, UpdateButton, BackButton, DiagnosisAutocomplete, SelectInput,
  Button, Preloader, Container, FormRow, ButtonGroup,
} from '../../components';
import { VISIT_SELECT_TEMPLATE, IMAGING_REQUEST_STATUSES, MUI_SPACING_UNIT as spacing } from '../../constants';
import { ImagingRequestModel, PatientModel } from '../../models';

const { dialog, shell } = electron;
const ViewImageButton = styled(Button)`
  float: left;
`;

const prepareFormData = ({ type, ...attributes }) => {
  if (!type) return attributes;
  return { ...attributes, type: type.id };
};

class Request extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visit: null,
      isFormValid: false,
      isLoading: true,
    };
  }

  componentDidMount() {
    this.props.initImagingRequest();
  }

  componentWillReceiveProps(newProps) {
    const { imagingRequestModel } = newProps;
    if (imagingRequestModel instanceof ImagingRequestModel) {
      imagingRequestModel.on('change', this.handleModelChange);
    }
    this.handleFetchedImagingRequest(newProps);
  }

  handleFetchedImagingRequest = (props = this.props) => {
    const { isLoading, imagingRequestModel } = props;
    if (!isLoading) {
      const formData = prepareFormData({
        ...imagingRequestModel.attributes,
        diagnosis: imagingRequestModel.get('diagnosis'),
      });
      this.setState({
        ...formData,
        isLoading,
        isFormValid: imagingRequestModel.isValid(),
      });
    }
  }

  handleModelChange = () => {
    const { imagingRequestModel } = this.props;
    const formData = prepareFormData(imagingRequestModel.changedAttributes());
    const isFormValid = imagingRequestModel.isValid();
    this.setState({ ...formData, isFormValid });
  }

  handlePatientChange = ({ _id }) => {
    this.props.initImagingRequest({ patientId: _id });
  }

  handleVisitChange = (visit) => {
    this.handleFormChange({ visit });
  }

  handleTypeChange = (imagingTypeId, name) => {
    this.handleFormChange({ [name]: { _id: imagingTypeId } });
  }

  handleDiagnosisChange = (selectedDiagnosis, name) => {
    this.handleFormChange({ [name]: selectedDiagnosis });
  }

  handleFormInput = (event) => {
    const { target: { name, value } } = event;
    this.handleFormChange({ [name]: value });
  }

  submitForm = (event) => {
    event.preventDefault();
    const { imagingRequestModel, action } = this.props;
    this.props.saveImagingRequest({ imagingRequestModel, action });
  }

  markAsCompleted = () => {
    const { imagingRequestModel, markImagingRequestCompleted } = this.props;
    imagingRequestModel.set('status', IMAGING_REQUEST_STATUSES.COMPLETED);
    markImagingRequestCompleted({ imagingRequestModel });
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

  handleFormChange(change) {
    const { imagingRequestModel } = this.props;
    imagingRequestModel.set(change);
  }

  render() {
    const { isLoading } = this.state;
    if (isLoading) return <Preloader />;

    const {
      action, patientModel, isPatientSelected, imagingTypes,
    } = this.props;
    const {
      visit, location, type, notes,
      detail, isFormValid, diagnosis, status,
    } = this.state;

    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} Imaging Request`} />
        <form
          className="create-container"
          onSubmit={this.submitForm}
        >
          <Container>
            {isPatientSelected
              && <TopRow patient={patientModel.toJSON()} />
            }
            <Grid container spacing={spacing * 2} direction="column">
              {action === 'new'
                && (
                <FormRow>
                  {!isPatientSelected
                    && (
                      <PatientAutocomplete
                        label="Patient"
                        name="patient"
                        onChange={this.handlePatientChange}
                        required
                      />
                    )
                  }
                  <PatientRelationSelect
                    relation="visits"
                    template={VISIT_SELECT_TEMPLATE}
                    label="Visit"
                    name="visit"
                    patientModel={patientModel}
                    value={visit}
                    onChange={this.handleVisitChange}
                  />
                </FormRow>
                )
              }
              {action !== 'new'
                && (
                <FormRow>
                  <DiagnosisAutocomplete
                    label="Diagnosis"
                    name="diagnosis"
                    onChange={this.handleDiagnosisChange}
                    value={diagnosis}
                  />
                  <TextInput
                    label="Detail"
                    name="detail"
                    onChange={this.handleFormInput}
                    value={detail}
                    required
                  />
                </FormRow>
                )
              }
              <FormRow>
                <SelectInput
                  label="Type"
                  name="type"
                  options={imagingTypes}
                  className="column"
                  onChange={this.handleTypeChange}
                  value={type}
                />
                <TextInput
                  label="Location"
                  name="location"
                  onChange={this.handleFormInput}
                  value={location}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  label="Notes"
                  name="notes"
                  onChange={this.handleFormInput}
                  value={notes}
                  rows="2"
                  multiline
                />
              </FormRow>
              <Grid container item justify="flex-end">
                <ButtonGroup>
                  {status === IMAGING_REQUEST_STATUSES.COMPLETED
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
                        disabled={!isFormValid}
                        can={{ do: 'create', on: 'imaging' }}
                      />
                    )
                    : (
                      <React.Fragment>
                        <Button
                          color="secondary"
                          variant="contained"
                          can={{ do: 'update', on: 'imaging', field: 'status' }}
                          onClick={this.markAsCompleted}
                          disabled={status === IMAGING_REQUEST_STATUSES.COMPLETED || !isFormValid}
                        >
                          {status !== IMAGING_REQUEST_STATUSES.COMPLETED ? 'Mark as Completed' : 'Completed'}
                        </Button>
                        <UpdateButton
                          type="submit"
                          disabled={!isFormValid || status === IMAGING_REQUEST_STATUSES.COMPLETED}
                          can={{ do: 'update', on: 'imaging' }}
                        />
                      </React.Fragment>
                    )
                  }
                </ButtonGroup>
              </Grid>
            </Grid>
          </Container>
        </form>
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
  imagingRequestModel: PropTypes.instanceOf(ImagingRequestModel).isRequired,
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
