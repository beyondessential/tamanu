import React from 'react';
import styled from 'styled-components';

const Line = styled.p`
  margin: 0;
`;

export const getAreaNote = ({ areas, areaNote }) => {
  if (areas) {
    return areas.map(({ name, id }) => <div key={id}>{name}</div>);
  }
  if (areaNote) {
    return areaNote.split('\n').map(line => <Line>{line}</Line>);
  }
  return '';
};
