import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { ImportErrorsTable } from '../app/views/administration/components/ImportErrorsTable';
import { ImportStatsDisplay } from '../app/views/administration/components/ImportStatsDisplay';
import { ImportExportView } from '../app/views/administration/components/ImportExportView';
import { AssetUploaderView } from '../app/views/administration/AssetUploaderView';
import { SettingsView } from '../app/views/administration/settings/SettingsView';
import { MockedApi } from './utils/mockedApi';

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
      'referenceData:icd10': 10,
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
  await new Promise(resolve => setTimeout(resolve, 1000));
  action('submitEnd')();
  return {
    ...sampleResponse,
    duration: Math.random() + 1,
    ...overrides,
  };
};

const endpoints = {
  'admin/settings': data => {
    const { scope } = data;
    return {
      serverScope: scope,
      testValues: {
        boolean: true,
        number: 36,
        string: 'hello',
        array: [1, 2, 3],
      },
    };
  },
  'admin/facilities': () => {
    return [
      { id: 'facility-1', name: 'Facility 1' },
      { id: 'facility-2', name: 'Facility 2' },
    ];
  },
};

storiesOf('Admin/ImportExportView', module).add('Whole view', () => (
  <ImportExportView
    onSubmit={dummySubmit()}
    onReceiveResult={action('result')}
    onCancel={action('cancel')}
    dataTypes={['referenceData', 'user', 'patient']}
    dataTypesSelectable
  />
));

storiesOf('Admin/ImportStats', module).add('Default', () => (
  <ImportStatsDisplay stats={sampleResponse.stats} />
));

storiesOf('Admin/ErrorTable', module)
  .add('Default', () => <ImportErrorsTable errors={sampleResponse.errors} />)
  .add('No errors', () => <ImportErrorsTable errors={[]} />);

storiesOf('Admin/AssetUploaderView', module).add('Default', () => <AssetUploaderView />);

storiesOf('Admin/SettingsEditor', module)
  .addDecorator(Story => (
    <MockedApi endpoints={endpoints}>
      <Story />
    </MockedApi>
  ))
  .add('Default', () => <SettingsView />);
