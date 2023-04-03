import React from 'react';
import { Button, OutlinedButton } from '../../app/components';

export default {
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary'] },
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
    },
    isSubmitting: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    hasPermission: {
      control: 'boolean',
    },
  },
  title: 'Buttons/Button',
  component: Button,
};

const Template = args => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  color: 'primary',
  variant: 'contained',
  children: 'Button',
};

const OutlinedTemplate = args => <OutlinedButton {...args} />;
export const Outlined = OutlinedTemplate.bind({});
Outlined.args = {
  color: 'primary',
  children: 'Button',
};
