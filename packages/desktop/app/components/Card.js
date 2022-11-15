import React from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import { Colors } from '../constants';

export const Card = styled.div`
  background: white;
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
`;

export const CardHeader = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 12px;
  margin-bottom: 15px;
`;

export const CardBody = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 30px;
  grid-row-gap: 21px;
  max-width: 1050px;
`;

const CardCell = styled.div`
  font-size: 16px;
  line-height: 24px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const CardLabel = styled.span`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

export const CardDivider = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-3px);
  height: ${props => props.$height || '70px'};
  border-left: 1px solid ${Colors.softOutline};
`;

export const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props}>
    <CardLabel>{label}:</CardLabel>
    <CardValue>{value}</CardValue>
  </CardCell>
);

CardItem.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};

CardItem.defaultProps = {
  label: null,
  value: null,
};
