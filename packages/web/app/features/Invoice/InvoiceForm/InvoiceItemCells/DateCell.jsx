import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  Field,
  DateField,
  getDateDisplay,
  NoteModalActionBlocker,
} from '../../../../components';

const StyledItemCell = styled(Box)`
  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;

const ViewOnlyCell = styled.div`
  display: flex;
  font-size: 14px;
  padding-left: 15px;
`;

export const DateCell = ({ index, item, isItemEditable }) => (
  <StyledItemCell width="14%">
    {isItemEditable ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.orderDate`}
          required
          component={DateField}
          saveDateAsString
          data-testid="field-e3dv"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>
        {item?.orderDate ? getDateDisplay(item?.orderDate, 'dd/MM/yyyy') : ''}
      </ViewOnlyCell>
    )}
  </StyledItemCell>
);
