import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import React from 'react';
import styled, { css } from 'styled-components';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import DashedCircleOutlineIcon from './DashedCircleOutline';
import { MarDataCell } from './MarStatus';
import TableCellButton from './TableCellButton';

const styles = css`
  font-size: 24px;
  ${MarDataCell}:has(${TableCellButton}:nth-of-type(2)) & {
    font-size: 16px;
  }
`;

const GivenIcon = styled(CheckCircleRoundedIcon)`
  ${styles}
  color: ${TAMANU_COLORS.green};
`;

const NotGivenIcon = styled(CancelRoundedIcon)`
  ${styles}
  color: ${p => p.theme.palette.error.main};
`;

const MissedIcon = styled(HelpOutlineIcon)`
  ${styles}
  color: ${TAMANU_COLORS.darkOrange};
`;

const PendingIcon = styled(DashedCircleOutlineIcon)`
  ${styles}
  color: #b8b8b8;
`;

const iconMapping = /** @type {const} */ ({
  [ADMINISTRATION_STATUS.GIVEN]: GivenIcon,
  [ADMINISTRATION_STATUS.NOT_GIVEN]: NotGivenIcon,
  missed: MissedIcon,
  pending: PendingIcon,
});

/**
 * @param {import('@mui/material/SvgIcon').SvgIconProps & {
 *   variant: typeof ADMINISTRATION_STATUS.GIVEN | typeof ADMINISTRATION_STATUS.NOT_GIVEN | 'missed'
 * }} props
 */
export default function MarStatusIcon({ variant, ...props }) {
  const Component = iconMapping[variant];
  if (Component === undefined) return null;
  return <Component {...props} />;
}
