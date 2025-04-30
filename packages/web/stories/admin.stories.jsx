import React from 'react';
import { action } from '@storybook/addon-actions';

import { ImportErrorsTable } from '../app/views/administration/components/ImportErrorsTable';
import { ImportStatsDisplay } from '../app/views/administration/components/ImportStatsDisplay';
import { ImportExportView } from '../app/views/administration/components/ImportExportView';
import { AssetUploaderView } from '../app/views/administration/AssetUploaderView';

const sampleResponse = {
  sentData: false,
  didntSendReason: 'dryRun',
  records: null,
  stats: {
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
      'referenceData:diagnosis': 10,
      'referenceData:triageReason': 10,
      'referenceData:imagingType': 4,
      'referenceData:procedureType': 10,
      'referenceData:labTestCategory': 5,
    },
    errors: {
      referenceData: 4,
      user: 4,
      patient: 2,
      total: 10,
      'referenceData:drug': 4,
    },
  },
  errors: [
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
  ],
};

const dummySubmit = overrides => async formData => {
  action('submitStart')(formData);
  await new Promise(resolve => {
    setTimeout(resolve, 1000);
  });
  action('submitEnd')();
  return {
    ...sampleResponse,
    duration: Math.random() + 1,
    ...overrides,
  };
};

export default {
  title: 'Admin',
};

export const ImportExportViewStory = {
  name: 'ImportExportView',
  render: () => (
    <ImportExportView
      onSubmit={dummySubmit()}
      onReceiveResult={action('result')}
      onCancel={action('cancel')}
      dataTypes={['referenceData', 'user', 'patient']}
      dataTypesSelectable
    />
  ),
};

export const ImportStatsStory = {
  name: 'ImportStats',
  render: () => <ImportStatsDisplay stats={sampleResponse.stats} />,
};

export const ErrorTableDefault = {
  name: 'ErrorTable/Default',
  render: () => <ImportErrorsTable errors={sampleResponse.errors} />,
};

export const ErrorTableNoErrors = {
  name: 'ErrorTable/NoErrors',
  render: () => <ImportErrorsTable errors={[]} />,
};

export const AssetUploaderViewStory = {
  name: 'AssetUploaderView',
  render: () => <AssetUploaderView />,
};
