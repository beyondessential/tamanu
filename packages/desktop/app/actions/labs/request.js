import { to } from 'await-to-js';
import { TestsCollection } from '../../collections';
import { notifySuccess, history } from '../../utils';
import {
  FETCH_LAB_REQUEST,
  FETCH_LAB_SUCCESS,
  FETCH_LAB_FAILED,
  SAVE_LAB_REQUEST,
  SAVE_LAB_SUCCESS,
  SAVE_LAB_FAILED,
} from '../types';
import {
  LabModel,
  PatientModel,
  TestCategoryModel,
  VisitModel,
} from '../../models';

export const initLabRequest = (patientId) =>
  async dispatch => {
    dispatch({ type: FETCH_LAB_REQUEST });
    try {
      // fetch all tests
      const testsCollection = new TestsCollection();
      await testsCollection.fetchAll();
      // fetch patient if defined
      const patientModel = new PatientModel();
      if (patientId) {
        patientModel.set({ _id: patientId });
        await to(patientModel.fetch());
      }
      dispatch({
        type: FETCH_LAB_SUCCESS,
        patient: patientModel.toJSON(),
        tests: testsCollection.toJSON(),
        isLoading: false,
      });
    } catch (error) {
      dispatch({ type: FETCH_LAB_FAILED, error });
    }
  };

export const createLabRequest = ({ labModel }) =>
  async dispatch => {
    dispatch({ type: SAVE_LAB_REQUEST });
    if (labModel.isValid()) {
      try {
        const labTypesFiltered = {};
        const visitId = labModel.get('visit');
        labModel.get('tests').forEach(labTestModel => {
          const categoryId = labTestModel.get('test').get('category').get('_id');
          const testCategoryModel = new TestCategoryModel({ _id : categoryId });
          if (labTypesFiltered[categoryId]) {
            const currentLabModel = labTypesFiltered[categoryId];
            currentLabModel.get('tests').push(labTestModel);
            currentLabModel.set('category', testCategoryModel);
          } else {
            const { attributes } = labModel;
            const newLabModel = new LabModel({ ...attributes, tests: [] });
            newLabModel.get('tests').push(labTestModel);
            newLabModel.set('category', testCategoryModel);
            labTypesFiltered[categoryId] = newLabModel;
          }
        });

        await Promise.all(labModel.get('tests').map(labTestModel => labTestModel.save()));
        const labModels = await Promise.all(Object.values(labTypesFiltered).map(labModel => labModel.save()));
        // link lab requests to visit
        const visitModel = new VisitModel({ _id: visitId });
        await visitModel.fetch();
        visitModel.get('labs').add(labModels);
        await visitModel.save();

        dispatch({ type: SAVE_LAB_SUCCESS });
        notifySuccess("Lab request was created successfully.");
        if (labModels.length > 1) {
          history.push('/labs');
        } else {
          history.push(`/labs/request/${labModels[0].id}`);
        }
      } catch (error) {
        console.error({ error });
        dispatch({ type: SAVE_LAB_FAILED, error });
      }
    } else {
      const error = labModel.validationError;
      console.error({ error });
      dispatch({ type: SAVE_LAB_FAILED, error });
    }
  };
