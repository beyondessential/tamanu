import React from 'react';
import { storiesOf } from '@storybook/react';
import { Tabs } from '../app/components';

const tabsWithIcons = [
  {
    label: 'Tab 1',
    value: 'tab-1',
    icon: 'fa fa-info-circle',
  },
  {
    label: 'Tab 2',
    value: 'tab-2',
    icon: 'fa fa-info-circle',
  },
  {
    label: 'Tab 3',
    value: 'tab-3',
    icon: 'fa fa-info-circle',
  },
];

const tabsWithoutIcons = tabsWithIcons.map(({ icon, ...rest }) => rest);

const MockTabs = ({ tabs }) => {
  const [value, setValue] = React.useState('tab-1');

  const onChange = key => {
    setValue(key);
  };

  return <Tabs tabs={tabs} onChange={onChange} value={value} />;
};

storiesOf('Tabs', module)
  .add('Plain', () => <MockTabs tabs={tabsWithoutIcons} />)
  .add('With icons', () => <MockTabs tabs={tabsWithIcons} />);
