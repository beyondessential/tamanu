import React from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';

const CardCell = styled.div`
  font-size: 14px;
  line-height: 18px;
  margin-bottom: 2px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const CardLabel = styled.span`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
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
