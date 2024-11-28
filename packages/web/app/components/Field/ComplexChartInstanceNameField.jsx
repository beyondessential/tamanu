import React from 'react';
import { LimitedTextField } from './TextField';

export const ComplexChartInstanceNameField = props => <LimitedTextField {...props} limit={15} />;
