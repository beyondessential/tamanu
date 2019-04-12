import { ImagingTypesCollection } from '../../collections';
import { notifySuccess, history } from '../../utils';
import {
  FETCH_IMAGING_REQUEST_REQUEST,
  FETCH_IMAGING_REQUEST_SUCCESS,
  FETCH_IMAGING_REQUEST_FAILED,
  SAVE_IMAGING_REQUEST_REQUEST,
  SAVE_IMAGING_REQUEST_SUCCESS,
  SAVE_IMAGING_REQUEST_FAILED,
} from '../types';
import {
  ImagingRequestModel,
  PatientModel,
  VisitModel,
  UserModel,
} from '../../models';

export const initImagingRequest = ({ patientId, id }) => async dispatch => {
  dispatch({ type: FETCH_IMAGING_REQUEST_REQUEST });
  try {
    let patientModel = new PatientModel();
    let patient;
    // fetch all imaging types
    const imagingTypesCollection = new ImagingTypesCollection();
    await imagingTypesCollection.fetchAll();
    let imagingTypes = imagingTypesCollection.toJSON();
    imagingTypes = imagingTypes.map(({ name, _id }) => ({ label: name, value: _id }));

    // load imaging request
    const imagingRequestModel = new ImagingRequestModel();
    if (id) {
      imagingRequestModel.set({ _id: id });
      await imagingRequestModel.fetch();
      // set visit `id` only
      const { parents: { visit: { id: visitId } } } = imagingRequestModel;
      imagingRequestModel.set('visit', visitId);
      // get the patient
      const { parents: { visit: { parents } } } = imagingRequestModel;
      patientModel = parents.patient;
    }

    // fetch patient if defined
    if (patientId) {
      patientModel.set({ _id: patientId });
      await patientModel.fetch();
    }

    dispatch({
      type: FETCH_IMAGING_REQUEST_SUCCESS,
      patient: patientModel,
      imagingTypes,
      isLoading: false,
      imagingRequestModel,
    });
  } catch (error) {
    dispatch({ type: FETCH_IMAGING_REQUEST_FAILED, error });
  }
};

export const saveImagingRequest = ({ imagingRequestModel, action }) => async (dispatch, getState) => {
  dispatch({ type: SAVE_IMAGING_REQUEST_REQUEST });
  if (imagingRequestModel.isValid()) {
    try {
      const { auth: { userId } } = getState();
      const visitId = imagingRequestModel.get('visit');
      const requestedBy = new UserModel({ _id: userId });
      imagingRequestModel.set({ requestedBy });

      await imagingRequestModel.save(null, { validate: false });
      await _updateVisit(visitId, imagingRequestModel);

      dispatch({ type: SAVE_IMAGING_REQUEST_SUCCESS, imagingRequestModel });
      notifySuccess('Imaging request was saved successfully.');
      if (action === 'new') history.push(`/imaging/request/${imagingRequestModel.id}`);
    } catch (error) {
      console.error({ error });
      dispatch({ type: SAVE_IMAGING_REQUEST_FAILED, error });
    }
  } else {
    const error = imagingRequestModel.validationError;
    console.error({ error });
    dispatch({ type: SAVE_IMAGING_REQUEST_FAILED, error });
  }
};

export const markImagingRequestCompleted = ({ imagingRequestModel }) => async (dispatch) => {
  dispatch({ type: SAVE_IMAGING_REQUEST_REQUEST });
  try {
    await imagingRequestModel.save();
    dispatch({ type: SAVE_IMAGING_REQUEST_SUCCESS, imagingRequestModel });
    notifySuccess('Imaging request marked as completed');
    history.push('/imaging/completed');
  } catch (error) {
    console.error({ error });
    dispatch({ type: SAVE_IMAGING_REQUEST_FAILED, error });
  }
};

const _updateVisit = async (visitId, imagingRequestModel) => {
  // link imaging request to visit
  const visitModel = new VisitModel({ _id: visitId });
  await visitModel.fetch();
  visitModel.get('imagingRequests').add(imagingRequestModel);
  await visitModel.save();
};
