import { to } from 'await-to-js';
import moment from 'moment';
import {
  pageSizes,
  dateFormat,
} from '../../constants';
import {
  FETCH_MEDICATIONS_REQUEST,
  FETCH_MEDICATIONS_SUCCESS,
  FETCH_MEDICATIONS_FAILED,
} from '../types';
import { MedicationCollection } from '../../collections';

export const fetchMedications = ({ page, filters = {} }) =>
  async dispatch => {
    try {
      dispatch({ type: FETCH_MEDICATIONS_REQUEST });
      let medications = [];
      const medicationCollection = new MedicationCollection({
        pageSize: pageSizes.medicationRequests
      });
      // medicationCollection.setPageSize(pageSizes.medicationRequests);
      await medicationCollection.getPage(page, { data: filters });
      if (medicationCollection.models.length > 0) {
        const tasks = [];
        medicationCollection.models.forEach(model => tasks.push(_prepareMedication(model)));
        medications = await Promise.all(tasks);
      }

      dispatch({
        type: FETCH_MEDICATIONS_SUCCESS,
        medications,
        totalPages: medicationCollection.totalPages,
        loading: false,
      });
    } catch (err) {
      dispatch({ type: FETCH_MEDICATIONS_FAILED, err })
    }
  };

  const _prepareMedication = async (model) => {
    const medication = model.toJSON();
    const patient = await model.getPatient();

    if (medication.prescriptionDate !== '') medication.prescriptionDate = moment(medication.prescriptionDate).format(dateFormat);
    medication.patient = `${patient.get('firstName')} ${patient.get('lastName')}`;
    medication.drug = model.attributes.drug.get('name');
    medication.quantity = `Morning ${medication.qtyMorning}, L: ${medication.qtyLunch}, E: ${medication.qtyEvening}, N: ${medication.qtyNight}`;
    return medication;
  };
