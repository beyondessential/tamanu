import React from 'react';
import TimelapseIcon from '@material-ui/icons/Timelapse';
import { Tile } from '../app/components';

export default {
  argTypes: {
    iconDirection: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
  },
  title: 'Tile',
  component: Tile,
};

const Template = args => <Tile {...args} />;

export const Vertical = Template.bind({});
Vertical.args = {
  Icon: TimelapseIcon,
  title: 'Priority',
  text: 'Standard',
  actions: [
    { label: 'Etendre', onClick: () => {} },
    { label: 'Relever', onClick: () => {} },
    { label: 'Glisser', onClick: () => {} },
  ],
};
