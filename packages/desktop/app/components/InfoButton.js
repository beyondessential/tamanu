import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';

const InfoIcon = styled.div`
  display: inline-block;
  border: 1px solid ${Colors.softText};
  border-radius: 4em;
  width: 1em;
  height: 1em;
  background: ${Colors.softText};
  cursor: pointer;
  text-align: center;
  color: white;
  vertical-align: bottom;
  top: -3px;
  position: relative;
`;

export const InfoButton = ({ onClick }) => <InfoIcon onClick={onClick}>i</InfoIcon>;
