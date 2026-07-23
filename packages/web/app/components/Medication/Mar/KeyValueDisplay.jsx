import React from 'react';
import styled from 'styled-components';

const Key = styled.h4`
  color: ${p => p.theme.palette.text.tertiary};
  font: inherit;
  margin-block: 0;
  &:not(:first-child) {
    margin-block-start: 1em;
  }
`;

const Value = styled.p`
  color: ${p => p.theme.palette.text.primary};
  font-weight: 500;
  margin-block: 0.25em 0;
`;

const KeyValueDisplay = styled(({ label, value, ...props }) => (
  <div {...props}>
    <Key>{label}</Key>
    <Value>{value}</Value>
  </div>
))`
  &:not(:first-child) {
    margin-block-start: 1em;
  }
`;

export default KeyValueDisplay;
