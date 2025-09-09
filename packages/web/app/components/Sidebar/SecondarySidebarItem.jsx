import React from 'react';
import styled from 'styled-components';
import { ListItem, ListItemText } from '@mui/material';

const SecondaryListItem = styled(ListItem)`
  margin-bottom: 2px;
  padding: 2px 0 2px 48px;
  border-radius: 4px;

  &:hover,
  &.Mui-selected,
  &.Mui-selected:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SecondaryItemText = styled(ListItemText)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: 0;
`;

const Dot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${props => props.$color};
  margin-right: 14px;
`;
export const SecondarySidebarItem = ({ path, label, isCurrent, disabled, onClick, color }) => {
  const dataTestIdSuffix = path.replace(/\//g, '-');
  return (
    <SecondaryListItem
      button
      to={path}
      disabled={disabled}
      selected={isCurrent}
      onClick={onClick}
      data-test-class="secondary-sidebar-item"
      data-testid={`secondarylistitem${dataTestIdSuffix}`}
    >
      {color && <Dot $color={color} />}
      <SecondaryItemText
        disableTypography
        primary={label}
        data-testid={`secondaryitemtext-${dataTestIdSuffix}`}
      />
    </SecondaryListItem>
  );
};
