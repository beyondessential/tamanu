import React from 'react';
import { P } from '../patientCertificates/Typography';
import { Row } from '../patientCertificates/Layout';

export const DataItem = ({ label, value }) => {
  return (
    <Row>
      <P style={{ marginVertical: 3 }} bold>
        {label}:
      </P>
      <P style={{ marginVertical: 3 }}> {value}</P>
    </Row>
  );
};
