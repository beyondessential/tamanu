import { to } from 'await-to-js';
import moment from 'moment';
import { pageSizes, dateFormat } from '../../constants';
import {
  FETCH_MEDICATIONS_REQUEST,
  FETCH_MEDICATIONS_SUCCESS,
  FETCH_MEDICATIONS_FAILED,
} from '../types';
import { MedicationCollection } from '../../collections';

export const fetchMedications = ({ page }) =>
  async dispatch => {
    dispatch({ type: FETCH_MEDICATIONS_REQUEST });
    const medicationCollection = new MedicationCollection();
    medicationCollection.setPage(page);
    medicationCollection.setPageSize(pageSizes.medicationRequests);
    medicationCollection.fetchByView({
      view: 'medication_by_status',
      fetchRelations: true,
      success: () => {
        const medications = medicationCollection.models.map(model => {
          const medication = model.toJSON();
          if (medication.prescriptionDate !== '') medication.prescriptionDate = moment(medication.prescriptionDate).format(dateFormat);
          medication.patient = `${model.attributes.patient.get('firstName')} ${model.attributes.patient.get('lastName')}`;
          medication.drug = model.attributes.drug.get('name');
          medication.quantity = `Morning ${medication.qtyMorning}, L: ${medication.qtyLunch}, E: ${medication.qtyEvening}, N: ${medication.qtyNight}`;
          return medication;
        });

        dispatch({
          type: FETCH_MEDICATIONS_SUCCESS,
          medications,
          totalPages: medicationCollection.totalPages,
          loading: false,
        });
      },
      error: err => {
        dispatch({ type: FETCH_MEDICATIONS_FAILED, err })
      }
    });
  };
