import React from 'react';
import { render } from '@testing-library/react-native';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { PatientHistoryAccordion } from './index';
import { data } from './fixtures';

describe('PatientHistoryAccordion', () => {
  const { getAllByText, getByText, findByText } = render(
    <PatientHistoryAccordion dataArray={data} />,
  );
});
