import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { facilityItems } from '../app/components/Sidebar/config';
import { Sidebar } from '../app/components/Sidebar';

storiesOf('Sidebar', module).add('Sidebar', () => (
  <div style={{ maxWidth: '25rem' }}>
    <Sidebar
      currentPath="/test/abc"
      onPathChanged={action('path')}
      onLogout={action('logout')}
      items={facilityItems}
    />
  </div>
));
