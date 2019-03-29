import React from 'react';
import { PatientModel } from '../../models';
import { DateDisplay } from '../../components';

export const prepareMedication = (model) => {
  const medication = model.toJSON();
  const patientModel = new PatientModel(model.get('patient'));
  medication.prescriptionDate = <DateDisplay date={medication.prescriptionDate} />;
  medication.patient = patientModel.getDisplayName();
  medication.drug = model.attributes.drug.get('name');
  medication.quantity = `Morning ${medication.qtyMorning}, L: ${medication.qtyLunch}, E: ${medication.qtyEvening}, N: ${medication.qtyNight}`;
  return medication;
};
