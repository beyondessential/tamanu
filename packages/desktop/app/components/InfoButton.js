import React from 'react';
import styled from 'styled-components';

const InfoIcon = styled.div`
  display: inline-block;
  border: 1px solid #88d;
  border-radius: 4em;
  width: 1em;
  height: 1em;
  background: #88d;
  cursor: pointer;
  text-align: center;
  color: white;
`;

export const InfoButton = ({ onClick }) => <InfoIcon onClick={onClick}>i</InfoIcon>;
