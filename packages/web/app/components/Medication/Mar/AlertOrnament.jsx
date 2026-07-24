import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import React from 'react';
import styled from 'styled-components';

import { useTranslation } from '@tamanu/ui-components';

const AlertOrnament = styled(
  /**  @param {import('@mui/material/SvgIcon').SvgIconProps} props */
  function (props) {
    const { getTranslation } = useTranslation();
    return (
      <PriorityHighIcon
        aria-hidden={undefined}
        color="error"
        titleAccess={getTranslation('medication.mar.alert', 'Alert.')}
        {...props}
      />
    );
  },
)`
  inset-block-end: 3px;
  inset-inline-end: 0;
  position: absolute;
  &.MuiSvgIcon-root {
    font-size: 18px;
  }
`;

export default AlertOrnament;
