import React from 'react';
import styled from 'styled-components';

const InfoIcon = styled.div`
  display: inline-block;
  border: 1px solid #b8b8b8;
  border-radius: 4em;
  width: 1em;
  height: 1em;
  background: #b8b8b8;
  cursor: pointer;
  text-align: center;
  color: white;
  vertical-align: super;
`;

export const InfoButton = ({ onClick }) => <InfoIcon onClick={onClick}>i</InfoIcon>;
