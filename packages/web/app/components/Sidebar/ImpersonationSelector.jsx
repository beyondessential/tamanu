import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { MenuItem, MenuList, Popover, Typography, ListSubheader } from '@material-ui/core';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { startImpersonation, stopImpersonation } from '../../store/auth';

const StyledPopover = styled(Popover)`
  .MuiPaper-root {
    background: ${Colors.primaryDark};
    color: ${Colors.white};
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    min-width: 200px;
    max-height: 400px;
    margin-left: 8px;
  }
`;

const Header = styled(ListSubheader)`
  background: ${Colors.primaryDark};
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 32px;
`;

const StyledMenuItem = styled(MenuItem)`
  font-size: 13px;
  color: ${Colors.white};
  padding: 6px 16px;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StopItem = styled(StyledMenuItem)`
  color: ${Colors.alert};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 4px;
  font-weight: 500;
`;

const ActiveRole = styled(Typography)`
  font-size: 11px;
  color: ${Colors.alert};
  padding: 4px 16px 8px;
  font-weight: 500;
`;

export const ImpersonationPopover = ({ anchorEl, open, onClose }) => {
  const dispatch = useDispatch();
  const api = useApi();
  const impersonatingRole = useSelector(state => state.auth.impersonatingRole);

  const { data: roles = [] } = useQuery(
    ['admin', 'roles'],
    () => api.get('admin/roles'),
    { staleTime: 5 * 60 * 1000, enabled: open },
  );

  const handleSelect = (role) => {
    dispatch(startImpersonation(role));
    onClose();
  };

  const handleStop = () => {
    dispatch(stopImpersonation());
    onClose();
  };

  return (
    <StyledPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
    >
      <MenuList dense>
        <Header>Impersonate role</Header>
        {impersonatingRole && (
          <ActiveRole>
            Active: {impersonatingRole.name}
          </ActiveRole>
        )}
        {roles.map(role => (
          <StyledMenuItem
            key={role.id}
            onClick={() => handleSelect(role)}
            selected={impersonatingRole?.id === role.id}
          >
            {role.name}
          </StyledMenuItem>
        ))}
        {impersonatingRole && (
          <StopItem onClick={handleStop}>
            Stop impersonating
          </StopItem>
        )}
      </MenuList>
    </StyledPopover>
  );
};
