import React from 'react';
import styled from 'styled-components';

const Pre = styled.pre`
  font-family: inherit;
  text-wrap-mode: initial;
  white-space-collapse: preserve;
`;

const MultilineResult = ({ answer }) => {
  return <Pre>{answer}</Pre>;
};

export default MultilineResult;
