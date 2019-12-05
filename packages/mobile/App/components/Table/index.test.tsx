import React from 'react';
import { render } from '@testing-library/react-native';
import {
  patientHistoryList,
  vitalsTableCols,
  vitalsTableHeader,
} from './fixtures';
import { PatientVitalsList } from '../../helpers/constants';
import { Table } from '.';

describe('<TableData />', () => {
  describe('Vitals Table', () => {
    const titleProp = 'Measures';
    const { getByText, queryAllByText } = render(
      <Table
        columns={vitalsTableCols}
        title={'Measures'}
        data={patientHistoryList}
        tableHeader={vitalsTableHeader}
      />,
    );

    it('should render table title', () => {
      expect(getByText(titleProp)).not.toBeNull();
    });

    it('should render TableData header informations', () => {
      for (const col of vitalsTableCols) {
        expect(getByText(col.title)).not.toBeNull();
      }
    });

    it('should render TableData props', () => {
      for (const patientData of patientHistoryList) {
        for (const vitalProp of PatientVitalsList) {
          expect(
            queryAllByText(patientData[vitalProp].toString()).length > 0,
          ).not.toBeFalsy();
        }
      }
    });
  });
});
