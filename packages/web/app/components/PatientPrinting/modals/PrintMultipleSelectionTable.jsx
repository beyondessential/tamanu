import { TAMANU_COLORS } from '@tamanu/ui-components';
import React from 'react';
import styled from 'styled-components';
import { Table } from '../../Table';
import { Colors } from '../../../constants';
import { OuterLabelFieldWrapper } from '../../Field';

const StyledSelectionTable = styled(Table)`
  border: none;
  border-radius: 5px;
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr td:first-child {
    border-bottom: none;
  }
  thead tr th {
    color: ${TAMANU_COLORS.midText};
    span {
      white-space: break-spaces;
    }
  }
`;

const StyledOuterLayerFieldWrapper = styled(OuterLabelFieldWrapper)`
  .label-field {
    margin-bottom: 15px;
  }
  padding: 25px 30px;
`;

export const FormDivider = styled.div`
  margin: 15px 0 30px 0;
  width: calc(100% + 64px);
  height: 1px;
  background-color: ${TAMANU_COLORS.outline};
  position: relative;
  left: -32px;
`;

export const PrintMultipleSelectionTable = ({ label, ...props }) => {
  return (
    <StyledOuterLayerFieldWrapper label={label} data-testid="styledouterlayerfieldwrapper-tej8">
      <StyledSelectionTable {...props} data-testid="styledselectiontable-tnod" />
    </StyledOuterLayerFieldWrapper>
  );
};
