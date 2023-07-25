import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants';

const JSONContainer = styled.pre`
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 15px;
`;

export const JSONViewer = React.memo(({ json }) => {
  return <JSONContainer>{JSON.stringify(json, null, 2)}</JSONContainer>;
});
