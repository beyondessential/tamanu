import React from 'react';
import { Notification } from '../app/components/Notification';

export default {
  title: 'Notification',
};

export const Placeholder = () => <Notification message="Hello" />;

Placeholder.story = {
  name: 'placeholder',
};
