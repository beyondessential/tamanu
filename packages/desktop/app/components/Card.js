import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Colors } from '../constants';

export const Card = styled.div`
  background: white;
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  padding: 18px 30px 24px;

  //width: 788px;
`;

export const CardHeader = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
`;

export const CardBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const CardCell = styled.div`
  display: flex;
  align-items: center;
  padding: 11px 0;
`;

const CardLabel = styled(Typography)`
  font-size: 16px;
  line-height: 21px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
  margin-left: 5px;
`;

export const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props}>
    <CardLabel>{label}:</CardLabel>
    <CardValue>{value}</CardValue>
  </CardCell>
);
