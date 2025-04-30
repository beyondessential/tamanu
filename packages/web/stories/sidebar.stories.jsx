import React from 'react';
import styled from 'styled-components';
import { action } from '@storybook/addon-actions';
import { FACILITY_MENU_ITEMS } from '../app/components/Sidebar/FacilityMenuItems';
import { Sidebar } from '../app/components/Sidebar';

const Container = styled.div`
  display: grid;
  height: 860px;
  width: 280px;
  grid-template-columns: 1fr 4fr;
`;

export default {
  title: 'Sidebar',
  component: Sidebar,
};

export const Default = {
  render: () => (
    <Container>
      <Sidebar
        currentPath="/test/abc"
        onPathChanged={action('path')}
        onLogout={action('logout')}
        items={FACILITY_MENU_ITEMS}
        facilityName="Etta Clinic"
        currentUser={{ displayName: 'Catherine Jennings' }}
      />
    </Container>
  ),
};
