import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import React from 'react';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';

const fontSize = 24;

/**
 * @param {import('@mui/material/SvgIcon').SvgIconProps & {
 *   variant: typeof ADMINISTRATION_STATUS.GIVEN | typeof ADMINISTRATION_STATUS.NOT_GIVEN | 'missed'
 * }} props
 */
export default function MarStatusIcon({ style, variant, ...props }) {
  switch (variant) {
    case ADMINISTRATION_STATUS.GIVEN:
      return (
        <CheckCircleRoundedIcon
          style={{ color: TAMANU_COLORS.green, fontSize, ...style }}
          {...props}
        />
      );
    case ADMINISTRATION_STATUS.NOT_GIVEN:
      return (
        <CancelRoundedIcon style={{ color: TAMANU_COLORS.alert, fontSize, ...style }} {...props} />
      );
    case 'missed':
      return (
        <HelpOutlineIcon
          style={{ color: TAMANU_COLORS.darkOrange, fontSize, ...style }}
          {...props}
        />
      );
    default:
      return null;
  }
}
