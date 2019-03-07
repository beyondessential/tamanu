import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import { request as imagingRequestActions} from '../../actions/imaging';
import moment from 'moment';
import { capitalize } from 'lodash';
import styled from 'styled-components';
import TopRow from '../Patients/components/TopRow';
import {
  TopBar,
  PatientAutocomplete,
  PatientRelationSelect,
  InputGroup,
  TextareaGroup,
  AddButton,
  UpdateButton,
  BackButton,
  DiagnosisAutocomplete,
  SelectGroup,
  Button,
} from '../../components';
import { dateFormat, IMAGING_REQUEST_STATUSES } from '../../constants';
import { ImagingRequestModel } from '../../models';

const ButtonsContainer = styled.div`
  padding: 8px 8px 32px 8px;
  text-align: right;
  > button {
    margin-right: 8px
  }
`;

const ViewImageButton = styled(Button)`
  float: left;
`;

const prepareFormData = ({ type: imagingType, ...fields }) => {
  const parsedData = {};
  if (imagingType) parsedData.type = imagingType.id || imagingType._id;
  return { ...parsedData, ...fields };
}

class Request extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visit: null,
      isFormValid: false,
      isLoading: true,
      selectedPatientId: '',
    }

    this.handlePatientChange = this.handlePatientChange.bind(this);
    this.handleVisitChange = this.handleVisitChange.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleFormInput = this.handleFormInput.bind(this);
    this.handleModelChange = this.handleModelChange.bind(this);
    this.handleDiagnosisChange = this.handleDiagnosisChange.bind(this);
    this.handleFetchedImagingRequest = this.handleFetchedImagingRequest.bind(this);
    this.markAsCompleted = this.markAsCompleted.bind(this);
    this.submitForm = this.submitForm.bind(this);
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

  handleFetchedImagingRequest(props = this.props) {
    const { patient: { _id: selectedPatientId }, isLoading, imagingRequestModel } = props;
    if (!isLoading) {
      const formData = prepareFormData({
        ...imagingRequestModel.toJSON(),
        diagnosis: imagingRequestModel.get('diagnosis'),
      });
      this.setState({
        ...formData,
        isLoading,
        selectedPatientId,
        isFormValid: imagingRequestModel.isValid(),
      });
    }
  }

  handleModelChange() {
    const { imagingRequestModel } = this.props;
    const { selectedPatientId } = this.state;
    const formData = prepareFormData(imagingRequestModel.changedAttributes());
    const isFormValid = imagingRequestModel.isValid() ; //&& !!selectedPatientId && !!visit;
    this.setState({ ...formData, isFormValid });
  }

  handlePatientChange(selectedPatientId) {
    this.setState({ selectedPatientId });
  }

  handleVisitChange(visit) {
    this.handleFormChange({ visit });
  }

  handleTypeChange(imagingTypeId, name) {
    this.handleFormChange({ [name]: { _id: imagingTypeId } });
  }

  handleDiagnosisChange(selectedDiagnosis, name) {
    this.handleFormChange({ [name]: selectedDiagnosis });
  }

  handleFormInput(event) {
    const { target: { name, value } } = event;
    this.handleFormChange({ [name]: value });
  }

  handleFormChange(change) {
    const { imagingRequestModel } = this.props;
    imagingRequestModel.set(change);
  }

  async submitForm(event) {
    event.preventDefault();
    const { imagingRequestModel, action } = this.props;
    this.props.saveImagingRequest({ imagingRequestModel, action });
  }

  markAsCompleted() {
    const { imagingRequestModel, markImagingRequestCompleted } = this.props;
    imagingRequestModel.set('status', IMAGING_REQUEST_STATUSES.COMPLETED);
    markImagingRequestCompleted({ imagingRequestModel });
  }

  render () {
    const { action, patient, isPatientSelected, imagingTypes } = this.props;
    const {
      selectedPatientId, visit, location, type, notes,
      detail, isFormValid, diagnosis, status
    } = this.state;

    return (
      <div className="create-content">
        <TopBar title={`${capitalize(action)} Imaging Request`} />
        <form
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="form with-padding">
            <Grid container spacing={8}>
              {isPatientSelected ?
                <Grid item container xs={12}>
                  <TopRow patient={patient} />
                </Grid> :
                <Grid item xs={6}>
                  <PatientAutocomplete
                    label="Patient"
                    name="patient"
                    onChange={this.handlePatientChange}
                    required
                  />
                </Grid>
              }
              {action === 'new' &&
                <Grid item xs={6}>
                  <PatientRelationSelect
                    className=""
                    relation="visits"
                    template={visit => `${moment(visit.startDate).format(dateFormat)} (${capitalize(visit.visitType)})`}
                    label="Visit"
                    name="visit"
                    patient={selectedPatientId}
                    value={visit}
                    onChange={this.handleVisitChange}
                  />
                </Grid>
              }
            </Grid>
            {action !== 'new' &&
              <Grid container>
                <Grid item xs={6}>
                  <DiagnosisAutocomplete
                    label="Diagnosis"
                    name="diagnosis"
                    onChange={this.handleDiagnosisChange}
                    value={diagnosis}
                  />
                </Grid>
                <InputGroup
                  label="Detail"
                  name="detail"
                  onChange={this.handleFormInput}
                  value={detail}
                  required
                />
              </Grid>
            }
            <Grid container>
              <Grid item xs={6}>
                <SelectGroup
                  label="Type"
                  name="type"
                  options={imagingTypes}
                  className="column"
                  onChange={this.handleTypeChange}
                  value={type}
                />
              </Grid>
              <Grid item xs={6}>
                <InputGroup
                  label="Location"
                  name="location"
                  onChange={this.handleFormInput}
                  value={location}
                />
              </Grid>
            </Grid>
            <Grid container>
              <TextareaGroup
                label="Notes"
                name="notes"
                onChange={this.handleFormInput}
                value={notes}
              />
            </Grid>
            <ButtonsContainer>
              {action !== 'new' &&
                <ViewImageButton
                  color="secondary"
                  variant="contained"
                >
                  View Image
                </ViewImageButton>
              }
              <BackButton />
              {action === 'new' ?
                <AddButton
                  type="submit"
                  disabled={!isFormValid}
                  can={{ do: 'create', on: 'imaging' }}
                /> :
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
              }
            </ButtonsContainer>
          </div>
        </form>
      </div>
    );
  }
};

Request.propTypes = {
  initImagingRequest: PropTypes.func.isRequired,
  saveImagingRequest: PropTypes.func.isRequired,
  markImagingRequestCompleted: PropTypes.func.isRequired,
  patient: PropTypes.object,
  imagingTypes: PropTypes.arrayOf(PropTypes.object),
  imagingRequestModel: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
}

Request.defaultProps = {
  patient: {},
  imagingTypes: [],
  isLoading: true,
  error: {},
}

function mapStateToProps({
  imaging: { patient, imagingTypes, isLoading, error, imagingRequestModel } },
  { match: { params: { patientId, id } = {} } }
) {
  return {
    patient, imagingTypes, isLoading,
    imagingRequestModel, error,
    isPatientSelected: !!patientId || !!id,
    action: id ? 'edit' : 'new'
  };
}

const { initImagingRequest, saveImagingRequest, markImagingRequestCompleted } = imagingRequestActions;
const mapDispatchToProps = (
  dispatch,
  { match: { params: { patientId, id } = {} } }
) => ({
  initImagingRequest: () => dispatch(initImagingRequest(patientId, id)),
  saveImagingRequest: (params) => dispatch(saveImagingRequest(params)),
  markImagingRequestCompleted: (params) => dispatch(markImagingRequestCompleted(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Request);