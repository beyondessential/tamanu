import React from 'react';
import styled from 'styled-components';
import { TextareaAutosize } from '@material-ui/core';
import { Colors } from '../../../constants';

const JSONViewContainer = styled.pre`
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 15px;
`;

const JSONEditContainer = styled(TextareaAutosize)`
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
  width: 100%;
  display: block;
`;

export const JSONViewer = React.memo(({ json }) => {
  return <JSONViewContainer>{JSON.stringify(json, null, 2)}</JSONViewContainer>;
});

export const JSONEditor = React.memo(({ json }) => {
  return <JSONEditContainer value={JSON.stringify(json, null, 2)} />;
});
