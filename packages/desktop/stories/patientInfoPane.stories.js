import React from 'react';
import { storiesOf } from '@storybook/react';
import { Provider } from 'react-redux';

import { createDummyPatient } from 'Shared/demoData';
import { PatientInfoPane } from '../app/components/PatientInfoPane';
import { API } from '../app/api/singletons';
import { initStore } from '../app/store';

const { store } = initStore(API);

const patient = createDummyPatient();

storiesOf('PatientInfoPane', module)
  .addDecorator(story => <Provider store={store}>{story()}</Provider>)
  .add('Basic Example', () => <PatientInfoPane patient={patient} />);
