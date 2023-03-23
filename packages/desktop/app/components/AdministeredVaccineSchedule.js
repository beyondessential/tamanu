import React from 'react';
import styled from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';

import { ControlLabel } from './ControlLabel';
import { Colors } from '../constants';

const AdministeredCheckbox = styled(Checkbox)`
  .MuiSvgIcon-root path {
    color: ${Colors.safe};
  }
`;

export const AdministeredVaccineSchedule = ({ option }) => (
  <ControlLabel control={<AdministeredCheckbox checked disabled />} label={option.label} />
);
