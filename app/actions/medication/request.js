import { to } from 'await-to-js';
import moment from 'moment';
import { visitStatuses } from '../../constants';
import {
  FETCH_MEDICATION_REQUEST,
  FETCH_MEDICATION_SUCCESS,
  FETCH_MEDICATION_FAILED,
  SAVE_MEDICATION_REQUEST,
  SAVE_MEDICATION_SUCCESS,
  SAVE_MEDICATION_FAILED,
} from '../types';
import { PatientModel, MedicationModel, VisitModel, DrugModel } from '../../models';

export const fetchMedication = ({ patientId, id }) =>
  async dispatch => {
    dispatch({ type: FETCH_MEDICATION_REQUEST });
    let error = null;
    const action = id ? 'edit' : 'new';
    const patientModel = new PatientModel();
    if (patientId) {
      patientModel.set({ _id: patientId });
      [error] = await to(patientModel.fetch({ relations: true, deep: false }));
    }
    const medicationModel = new MedicationModel();
    if (action === 'edit' && id && !error) {
      medicationModel.set({ _id: id });
      [error] = await to(medicationModel.fetch({ relations: true, deep: false }));
    }
    if (error) return dispatch({ type: FETCH_MEDICATION_FAILED, error });
    dispatch({
      type: FETCH_MEDICATION_SUCCESS,
      patient: patientModel,
      medication: medicationModel,
      loading: false,
    });
  };

export const saveMedication = ({ action, model, drugId, visitId, patientId, history }) =>
  async dispatch => {
    dispatch({ type: SAVE_MEDICATION_REQUEST });
    if (model.isValid()) {
      try {
        model.set('patient', patientId);
        model.set('visit', visitId);
        // Attach drug
        const drug = new DrugModel({ _id: drugId });
        await drug.fetch();
        model.set('drug', drug);
        // Set endDate
        const endDate = model.get('endDate');
        if (endDate instanceof moment && !endDate.isValid()) model.set('endDate', null, { silent: true });
        const Model = await model.save(null, { silent: true });
        // Attach to visit
        if (action === 'new'){
          const visitModel = new VisitModel();
          visitModel.set('_id', visitId);
          await visitModel.fetch({ relations: true, deep: false });
          visitModel.get('medication').add(Model);
          await visitModel.save(null, { silent: true });
        }
        dispatch({ type: SAVE_MEDICATION_SUCCESS });
        if (action === 'new') history.push('/medication/requests');
      } catch (error) {
        console.log({ error });
        dispatch({ type: SAVE_MEDICATION_FAILED, error });
      }
    } else {
      const error = model.validationError;
      console.log({ error });
      dispatch({ type: SAVE_MEDICATION_FAILED, error });
    }
  };
