import React, { memo } from 'react';
import styled from 'styled-components';
import Avatar from '@material-ui/core/Avatar';
import { Colors } from '../constants';

const StyledAvatar = styled(Avatar)`
  background: ${Colors.primary};
  color: ${Colors.white};
  text-transform: uppercase;
  width: 46px;
  height: 46px;
`;

export const PatientInitialsIcon = memo(({ patient }) => {
  const first = patient.firstName ? patient.firstName.substring(0, 1) : '';
  const last = patient.lastName ? patient.lastName.substring(0, 1) : '';
  return <StyledAvatar color="primary">{`${first}${last}`}</StyledAvatar>;
}); // TODO add sync status symbol
