import React from 'react';
import { Notification } from '../app/components/Notification';

export default {
  title: 'Notification',
  component: Notification,
};

export const Placeholder = {
  render: () => <Notification message="Hello" />,
};
