import { LabTestTypesCollection } from '../../collections';
import { notifySuccess, history } from '../../utils';
import {
  FETCH_LAB_REQUEST_REQUEST,
  FETCH_LAB_REQUEST_SUCCESS,
  FETCH_LAB_REQUEST_FAILED,
  SAVE_LAB_REQUEST_REQUEST,
  SAVE_LAB_REQUEST_SUCCESS,
  SAVE_LAB_REQUEST_FAILED,
} from '../types';
import {
  LabRequestModel,
  PatientModel,
  LabTestCategoryModel,
  VisitModel,
  UserModel,
} from '../../models';

export const initLabRequest = (patientId) =>
  async dispatch => {
    dispatch({ type: FETCH_LAB_REQUEST_REQUEST });
    try {
      // fetch all tests
      const labTestTypesCollection = new LabTestTypesCollection();
      await labTestTypesCollection.fetchAll();
      // fetch patient if defined
      const patientModel = new PatientModel();
      if (patientId) {
        patientModel.set({ _id: patientId });
        await patientModel.fetch();
      }
      dispatch({
        type: FETCH_LAB_REQUEST_SUCCESS,
        patient: patientModel.toJSON(),
        labTestTypes: labTestTypesCollection.toJSON(),
        isLoading: false,
      });
    } catch (error) {
      dispatch({ type: FETCH_LAB_REQUEST_FAILED, error });
    }
  };

export const createLabRequest = ({ labRequestModel }) =>
  async (dispatch, getState) => {
    dispatch({ type: SAVE_LAB_REQUEST_REQUEST });
    if (labRequestModel.isValid()) {
      try {
        const labTypesFiltered = {};
        const { auth: { userId } } = getState();
        const requestedBy = new UserModel({ _id: userId });
        const visitId = labRequestModel.get('visit');

        labRequestModel.get('tests').forEach(labTestModel => {
          const categoryId = labTestModel.get('type').get('category').get('_id');
          const testCategoryModel = new LabTestCategoryModel({ _id : categoryId });
          if (labTypesFiltered[categoryId]) {
            const currentLabRequestModel = labTypesFiltered[categoryId];
            currentLabRequestModel.get('tests').push(labTestModel);
            currentLabRequestModel.set('category', testCategoryModel);
            currentLabRequestModel.set('requestedBy', requestedBy);
          } else {
            const { attributes } = labRequestModel;
            const newLabRequestModel = new LabRequestModel({ ...attributes, tests: [] });
            newLabRequestModel.get('tests').push(labTestModel);
            newLabRequestModel.set('category', testCategoryModel);
            newLabRequestModel.set('requestedBy', requestedBy);
            labTypesFiltered[categoryId] = newLabRequestModel;
          }
        });

        await Promise.all(labRequestModel.get('tests').map(labTestModel => labTestModel.save()));
        const labRequestModels = await Promise.all(Object.values(labTypesFiltered).map(labRequestModel => labRequestModel.save()));
        _updateVisit(visitId, labRequestModels);

        dispatch({ type: SAVE_LAB_REQUEST_SUCCESS });
        notifySuccess("Lab request was created successfully.");
        if (labRequestModels.length > 1) {
          history.push('/labs');
        } else {
          history.push(`/labs/request/${labRequestModels[0].id}`);
        }
      } catch (error) {
        console.error({ error });
        dispatch({ type: SAVE_LAB_REQUEST_FAILED, error });
      }
    } else {
      const error = labRequestModel.validationError;
      console.error({ error });
      dispatch({ type: SAVE_LAB_REQUEST_FAILED, error });
    }
  };

const _updateVisit = async (visitId, labRequestModels) => {
  // link lab requests to visit
  const visitModel = new VisitModel({ _id: visitId });
  await visitModel.fetch();
  visitModel.get('labRequests').add(labRequestModels);
  await visitModel.save();
}