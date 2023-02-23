import React from 'react';
import { MenuButton } from '../../app/components';

export default {
  argTypes: {
    iconDirection: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
  },
  title: 'Buttons/MenuButton',
  component: MenuButton,
};

const Template = args => <MenuButton {...args} />;

export const Vertical = Template.bind({});
Vertical.args = {
  iconDirection: 'vertical',
  actions: {
    Etendre: () => {},
    Relever: () => {},
    Glisser: () => {},
  },
};
