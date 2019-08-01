import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Sidebar } from '../app/components/Sidebar';

storiesOf('Sidebar', module).add('Sidebar', () => (
  <div style={{ maxWidth: '25rem' }}>
    <Sidebar
      currentPath="/test/abc"
      onPathChanged={action('path')}
      onLogout={action('logout')}
      items={[
        {
          key: 'cars',
          label: 'Cars',
          children: [
            { label: 'Sedan', path: 'sedan' },
            { label: 'Semi-trailer', path: 'van' },
            { label: 'Racecar', path: 'ute' },
          ],
        },
        {
          key: 'bikes',
          label: 'Bikes',
          children: [
            { label: 'Fixie', path: 'fixie' },
            { label: 'Mountain bike', path: 'mountain' },
          ],
        },
        {
          key: 'public',
          label: 'Public transport',
          children: [
            { label: 'Train', path: 'train' },
            { label: 'Monorail', path: 'monorail' },
            { label: 'Bus', path: 'bus' },
            { label: 'Futuristic transport tube', path: 'tube' },
          ],
        },
      ]}
    />
  </div>
));
