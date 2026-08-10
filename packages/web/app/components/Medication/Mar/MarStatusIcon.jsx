import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { svgIconClasses } from '@mui/material/SvgIcon';
import React from 'react';
import styled, { css } from 'styled-components';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import DashedCircleOutlineIcon from './DashedCircleOutline';
import { MarDataCell, MarDoseSlot } from './components';

const styles = css`
  &,
  &.lucide,
  &.${svgIconClasses.root} {
    font-size: inherit;
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

/**
 * Stand-in for the cell-level dose info overlay, which a subslot is too small to show in a sensible
 * way. Only shown in a sub-divided cell once the dose info overlay is gone — i.e. once some dose in
 * the cell has been recorded or missed (see the hidden computation in MarDoseInfoOverlay).
 */
const PendingIcon = styled(DashedCircleOutlineIcon)`
  ${styles}
  color: #b8b8b8;
  display: none;
  ${MarDataCell}:not(:has([data-overlay-visible])):has(${MarDoseSlot}:nth-of-type(2)) & {
    display: block;
  }
`;

const iconMapping = /** @type {const} */ ({
  [ADMINISTRATION_STATUS.GIVEN]: GivenIcon,
  [ADMINISTRATION_STATUS.NOT_GIVEN]: NotGivenIcon,
  missed: MissedIcon,
  pending: PendingIcon,
});

/**
 * @param {import('@mui/material/SvgIcon').SvgIconProps & {
 *   variant: typeof ADMINISTRATION_STATUS.GIVEN | typeof ADMINISTRATION_STATUS.NOT_GIVEN | 'missed' | 'pending'
 * }} props
 */
export default function MarStatusIcon({ variant, ...props }) {
  const Component = iconMapping[variant];
  if (Component === undefined) return null;
  return <Component {...props} />;
}
