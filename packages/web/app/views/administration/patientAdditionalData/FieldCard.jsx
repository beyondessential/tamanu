import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import DeleteIcon from '@material-ui/icons/Delete';
import VisibilityIcon from '@material-ui/icons/Visibility';
import EditIcon from '@material-ui/icons/Edit';
import { IconButton } from '@material-ui/core';

import { VISIBILITY_STATUSES, PATIENT_FIELD_SOURCES } from '@tamanu/constants';
import { useTranslation } from '../../../contexts/Translation';
import { getFieldLabel } from './helpers';
import {
  FieldCardOuter,
  FieldCardInner,
  DragHandle,
  FieldInfo,
  FieldLabel,
  FieldActions,
  RequiredMark,
} from './styledComponents';

export const FieldCard = ({ layout, index, onToggleVisibility }) => {
  const { getTranslation } = useTranslation();

  return (
    <Draggable draggableId={layout.id} index={index}>
      {(provided, snapshot) => (
        <FieldCardOuter
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          $isDragging={snapshot.isDragging}
        >
          <FieldCardInner>
            <DragHandle>
              <DragIndicatorIcon fontSize="small" />
            </DragHandle>
            <FieldInfo>
              <FieldLabel>
                {getFieldLabel(layout, getTranslation)}
                {layout.fieldSource === PATIENT_FIELD_SOURCES.PATIENT && (
                  <RequiredMark>*</RequiredMark>
                )}
              </FieldLabel>
            </FieldInfo>
            <FieldActions>
              {layout.canHide !== false && (
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleVisibility(layout.id, VISIBILITY_STATUSES.HISTORICAL);
                  }}
                  title="Hide field"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" title="Edit field">
                <EditIcon fontSize="small" />
              </IconButton>
              {layout.canDelete !== false && (
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    // TODO: implement delete action
                  }}
                  title="Delete field"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </FieldActions>
          </FieldCardInner>
        </FieldCardOuter>
      )}
    </Draggable>
  );
};
