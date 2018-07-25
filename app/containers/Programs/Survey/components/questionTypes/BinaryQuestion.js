import React from 'react';
import { RadioQuestion } from './RadioQuestion';

export const BinaryQuestion = (props) => {
  props = { ...props, options: ['Yes', 'No'] };
  return <RadioQuestion {...props} />;
};
