import express from 'express';
import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const vitals = express.Router();

const EDITABLE_FIELDS = [
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
];

// Notes: vitals table is legacy. You should read vitals from surveys
vitals.get('/:id', simpleGet('Vitals', { auditAccess: true }));
vitals.put('/:id', simplePut('Vitals', { allowedFields: EDITABLE_FIELDS }));
vitals.post(
  '/',
  simplePost('Vitals', { allowedFields: [...EDITABLE_FIELDS, 'encounterId', 'id'] }),
);
