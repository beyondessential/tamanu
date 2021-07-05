import React from 'react';

import shortid from 'shortid';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { ProgramsAdminView } from '../app/views/administration/ProgramsAdminView';
import { ImportErrorsTable } from '../app/views/administration/components/ImportErrorsTable';
import { ImportStatsDisplay } from '../app/views/administration/components/ImportStatsDisplay';

storiesOf('Admin/Programs', module)
  .add('Whole view', () => (
    <ProgramsAdminView
      onSubmit={action('submit')}
      onCancel={action('cancel')}
    />
  ));

storiesOf('Admin/ImportStats', module)
  .add('Default', () => (
    <ImportStatsDisplay
      stats={{
        records: {
          referenceData: 89,
          user: 10,
          patient: 10,
          labTestType: 10,
          total: 119,
          'referenceData:village': 10,
          'referenceData:drug': 10,
          'referenceData:allergy': 10,
          'referenceData:department': 10,
          'referenceData:location': 10,
          'referenceData:icd10': 10,
          'referenceData:triageReason': 10,
          'referenceData:imagingType': 4,
          'referenceData:procedureType': 10,
          'referenceData:labTestCategory': 5
        },
        errors: {
          referenceData: 4,
          user: 4,
          patient: 2,
          total: 10,
          'referenceData:drug': 4
        }
      }}
    />
  ));

storiesOf('Admin/ErrorTable', module)
  .add('Default', () => (
    <ImportErrorsTable 
      errors={[
        {
          sheet: 'drugs',
          row: 13,
          recordType: 'referenceData',
          data: { code: '123', name: 'Test' },
          errors: ['id is a required field'],
        },
        {
          sheet: 'drugs',
          row: 15,
          recordType: 'referenceData',
          data: { id: '12a', code: '123!!', name: 'Test' },
          errors: ['code must not have any punctuation'],
        },
        {
          sheet: 'drugs',
          row: 17,
          recordType: 'referenceData',
          data: { code: '12!!', name: 'Test' },
          errors: ['id is a required field', 'code must not have any punctuation'],
        },
      ]}
    />
  ))
  .add('No errors', () => (
    <ImportErrorsTable errors={[]} />
  ));
