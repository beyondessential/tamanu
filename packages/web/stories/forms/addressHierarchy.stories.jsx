import React from 'react';
import styled from 'styled-components';
import { REFERENCE_DATA_RELATION_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import { Form } from '@tamanu/ui-components';
import { HierarchyFields } from '../../app/components/Field';
import { MockedApi } from '../utils/mockedApi';

const Container = styled.div`
  max-width: 600px;
  padding: 2rem;
`;

const endpoints = {
  'referenceData/addressHierarchyTypes': () => {
    return ['country', 'province', 'district', 'village'];
  },
};

export default {
  title: 'Form Fields/HierarchyFields',
  component: HierarchyFields,
  decorators: [
    (Story) => (
      <MockedApi endpoints={endpoints}>
        <Container>
          <Form
            onSubmit={async () => {}}
            render={(props) => {
              return <Story {...props} />;
            }}
          />
        </Container>
      </MockedApi>
    ),
  ],
};

export const Basic = {
  args: {
    relationType: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
    baseLevel: REFERENCE_TYPES.VILLAGE,
    fields: [
      { referenceType: 'country' },
      { referenceType: 'province' },
      { referenceType: 'district' },
      { referenceType: 'village' },
    ],
  },
};
