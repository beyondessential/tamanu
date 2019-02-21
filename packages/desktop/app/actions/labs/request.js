import { to } from 'await-to-js';
import { TestsCollection } from '../../collections';
import { has, values } from 'lodash';
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
        loading: false,
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
        labModel.get('tests').forEach(labTestModel => {
          const { test } = labTestModel.toJSON();
          const { category: { _id: categoryId } = {} } = test;
          if (labTypesFiltered[categoryId]) {
            const currentLabModel = labTypesFiltered[categoryId];
            currentLabModel.get('tests').push(labTestModel);
          } else {
            const { attributes } = labModel;
            delete attributes.tests;
            const newLabModel = new LabModel(attributes);
            newLabModel.get('tests').push(labTestModel);
            labTypesFiltered[categoryId] = newLabModel;
          }
        });

        const response = await Promise.all(Object.values(labTypesFiltered).map(labModel => labModel.save()));
        dispatch({ type: SAVE_LAB_SUCCESS });
        notifySuccess("Lab request was created successfully.");
        if (response.length > 1) {
          history.push('/labs');
        } else {
          history.push(`/labs/request/${response[0].id}`);
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
