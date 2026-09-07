import express from 'express';
import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const vitals = express.Router();

// Notes: vitals table is legacy. You should read vitals from surveys
vitals.get('/:id', simpleGet('Vitals', { auditAccess: true }));
vitals.put(
  '/:id',
  simplePut('Vitals', {
    allowedFields: [
      'avpu',
      'bloodInUrine',
      'dateRecorded',
      'dbp',
      'fastingBloodGlucose',
      'gcs',
      'heartRate',
      'height',
      'hemoglobin',
      'respiratoryRate',
      'sbp',
      'spo2',
      'temperature',
      'urineBilirubin',
      'urineGlucose',
      'urineKetone',
      'urineLeukocytes',
      'urineNitrites',
      'urinePh',
      'urineProtein',
      'urineSpecificGravity',
      'urobilinogen',
      'weight',
    ],
  }),
);
vitals.post(
  '/',
  simplePost('Vitals', {
    allowedFields: [
      'avpu',
      'bloodInUrine',
      'dateRecorded',
      'dbp',
      'encounterId',
      'fastingBloodGlucose',
      'gcs',
      'heartRate',
      'height',
      'hemoglobin',
      'id',
      'respiratoryRate',
      'sbp',
      'spo2',
      'temperature',
      'urineBilirubin',
      'urineGlucose',
      'urineKetone',
      'urineLeukocytes',
      'urineNitrites',
      'urinePh',
      'urineProtein',
      'urineSpecificGravity',
      'urobilinogen',
      'weight',
    ],
  }),
);
