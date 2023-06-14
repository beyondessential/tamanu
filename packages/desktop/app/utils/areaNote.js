import React from 'react';
import styled from 'styled-components';

const Line = styled.p`
  margin: 0;
`;

export const getAreaNote = ({ areas, areaNote }) => {
  if (areas && areas.length > 0) {
    return areas.map(({ name, id }) => <div key={id}>{name}</div>);
  }
  if (areaNote) {
    // there's no sensible way to key this except by array index
    // eslint-disable-next-line react/no-array-index-key
    return areaNote.split('\n').map((line, i) => <Line key={`${i}-${line}`}>{line}</Line>);
  }
  return '';
};
