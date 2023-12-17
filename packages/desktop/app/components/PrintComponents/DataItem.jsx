import React from 'react';
import { View } from '@react-pdf/renderer';
import { P, Row } from '../../../../shared/src/utils/patientCertificates';

export const DataItem = ({ label, value }) => {
  return (
    <Row>
      <P mt={'3px'} mb={'3px'} bold>
        {label}:
      </P>
      <P mt={'3px'} mb={'3px'}>
        {' '}{value}
      </P>
    </Row>
  );
};
