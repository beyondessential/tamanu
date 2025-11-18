import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  Field,
  NumberField,
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

export const QuantityCell = ({ index, item, isItemEditable }) => (
  <StyledItemCell width="10%" paddingLeft="24px">
    {isItemEditable ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.quantity`}
          component={NumberField}
          min={1}
          max={99}
          onInput={event => {
            if (!event.target.validity.valid) {
              event.target.value = '';
            }
          }}
          size="small"
          required
          data-testid="field-6aku"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>{item?.quantity}</ViewOnlyCell>
    )}
  </StyledItemCell>
);
