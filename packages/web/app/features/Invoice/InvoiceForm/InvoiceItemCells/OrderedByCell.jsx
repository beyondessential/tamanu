import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  AutocompleteField,
  Field,
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

export const OrderedByCell = ({
  index,
  item,
  isItemEditable,
  practitionerSuggester,
  handleChangeOrderedBy,
}) => (
  <StyledItemCell width="19%" data-testid="styleditemcell-tfvb">
    {isItemEditable ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.orderedByUserId`}
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          size="small"
          onChange={handleChangeOrderedBy}
          data-testid="field-xin4"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>{item?.orderedByUser?.displayName}</ViewOnlyCell>
    )}
  </StyledItemCell>
);
