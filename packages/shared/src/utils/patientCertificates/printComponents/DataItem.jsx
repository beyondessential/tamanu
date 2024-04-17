import React from 'react';
import { P } from '../Typography';
import { Row } from '../Layout';

export const DataItem = ({ label, value, fontSize = 9 }) => {
  return (
    <Row>
      <P style={{ marginVertical: 3 }} fontSize={fontSize} bold>
        {label}:{' '}
      </P>
      <P style={{ marginVertical: 3 }} fontSize={fontSize}>
        {value}
      </P>
    </Row>
  );
};
