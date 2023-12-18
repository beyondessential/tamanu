import React from 'react';
import { P } from '../Typography';
import { Row } from '../Layout';

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
