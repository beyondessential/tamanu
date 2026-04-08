import React from 'react';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import EditIcon from '@material-ui/icons/Edit';
import { IconButton } from '@material-ui/core';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { useTranslation } from '../../../contexts/Translation';
import { getFieldLabel } from './helpers';
import {
  HiddenFieldCard,
  HiddenFieldCardInner,
  FieldInfo,
  FieldLabel,
  FieldActions,
} from './styledComponents';

export const HiddenField = ({ layout, onToggleVisibility }) => {
  const { getTranslation } = useTranslation();

  return (
    <HiddenFieldCard>
      <HiddenFieldCardInner>
        <FieldInfo>
          <FieldLabel>{getFieldLabel(layout, getTranslation)}</FieldLabel>
        </FieldInfo>
      <FieldActions>
        <IconButton
          size="small"
          onClick={() => onToggleVisibility(layout.id, VISIBILITY_STATUSES.CURRENT)}
          title="Show field"
        >
          <VisibilityOffIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" title="Edit field">
          <EditIcon fontSize="small" />
        </IconButton>
        </FieldActions>
      </HiddenFieldCardInner>
    </HiddenFieldCard>
  );
};
