import React from 'react';
import styled from 'styled-components';
import { HierarchyFields } from '../../app/components/Field/HierarchyFields';
import { MockedApi } from '../utils/mockedApi';

const Container = styled.div`
  max-width: 600px;
  padding: 2rem;
`;

const endpoints = {
  'addressHierarchy/:type': () => {
    return ['country', 'province', 'district', 'village'];
  },
};

export default {
  title: 'Forms/HierarchyFields',
  component: HierarchyFields,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <Container>
          <Story />
        </Container>
      </MockedApi>
    ),
  ],
};

const BasicTemplate = args => {
  return HierarchyFields(args);
};

export const Basic = BasicTemplate.bind({});
