import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

import { createDummyPatient } from '@tamanu/shared/demoData';
import { PatientInfoPane } from '../app/components/PatientInfoPane';

const patient = createDummyPatient();

const Container = styled.div`
  width: 330px;
`;

storiesOf('PatientInfoPane', module)
  .addDecorator(story => <Container>{story()}</Container>)
  .add('Basic Example', () => <PatientInfoPane patient={patient} />);
