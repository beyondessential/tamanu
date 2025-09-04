import React from 'react';
import styled from 'styled-components';
import Info from '@mui/icons-material/InfoOutlined';

const InfoIcon = styled(Info)`
  width: 1.2rem;
  height: 1.2rem;
  vertical-align: bottom;
  cursor: pointer;
`;

export const InfoButton = ({ onClick }) => (
  <InfoIcon onClick={onClick} data-testid="infoicon-cnfl" />
);
