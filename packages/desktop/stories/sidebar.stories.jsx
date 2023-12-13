import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';
import React from 'react';
import styled from 'styled-components';
import { Sidebar } from '../app/components/Sidebar';
import { FACILITY_MENU_ITEMS } from '../app/components/Sidebar/config';

const Container = styled.div`
  display: grid;
  height: 860px;
  width: 280px;
  grid-template-columns: 1fr 4fr;
`;

storiesOf('Sidebar', module).add('Sidebar', () => (
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
));
