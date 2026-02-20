import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Popover } from '@material-ui/core';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { startImpersonation, stopImpersonation } from '../../store/auth';

const StyledPopover = styled(Popover)`
  .MuiPaper-root {
    background: ${Colors.primaryDark};
    border: 1px solid ${Colors.outline};
    border-radius: 4px;
    min-width: 180px;
    max-height: 400px;
    margin-left: 8px;
    padding: 4px;
    display: flex;
    flex-direction: column;
  }
`;

const RoleList = styled.div`
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const RoleItem = styled.div`
  font-weight: ${props => (props.$active ? 500 : 400)};
  font-size: 11px;
  line-height: 15px;
  color: ${Colors.white};
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  background: ${props => (props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  :hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const StopItem = styled(RoleItem)`
  color: ${Colors.alert};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 4px;
  padding-top: 8px;
  border-radius: 0 0 4px 4px;
  flex-shrink: 0;
`;

const Header = styled.div`
  font-size: 11px;
  font-weight: 500;
  line-height: 15px;
  color: rgba(255, 255, 255, 0.5);
  padding: 4px 8px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
`;

const ActiveLabel = styled.div`
  font-size: 9px;
  font-weight: 400;
  color: ${Colors.alert};
  padding: 2px 8px 4px;
`;

export const ImpersonationPopover = ({ anchorEl, open, onClose }) => {
  const dispatch = useDispatch();
  const api = useApi();
  const queryClient = useQueryClient();
  const impersonatingRole = useSelector(state => state.auth.impersonatingRole);
  const currentUserRole = useSelector(state => state.auth.user?.role);

  const { data: allRoles = [] } = useQuery(['admin', 'roles'], () => api.get('admin/roles'), {
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });
  const roles = allRoles.filter(r => r.id !== currentUserRole);

  const pendingRole = useRef(undefined);

  const refreshUI = () => {
    queryClient.invalidateQueries({ predicate: q => q.queryKey[0] !== 'admin' });
  };

  const handleExited = async () => {
    if (pendingRole.current === undefined) return;
    const role = pendingRole.current;
    pendingRole.current = undefined;
    if (role) {
      await dispatch(startImpersonation(role));
    } else {
      await dispatch(stopImpersonation());
    }
    refreshUI();
  };

  const handleSelect = role => {
    pendingRole.current = role;
    onClose();
  };

  const handleStop = () => {
    pendingRole.current = null;
    onClose();
  };

  return (
    <StyledPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      transitionDuration={120}
      TransitionProps={{ onExited: handleExited }}
    >
      <Header>Impersonate role</Header>
      {impersonatingRole && <ActiveLabel>Viewing as {impersonatingRole.name}</ActiveLabel>}
      <RoleList>
        {roles.map(role => (
          <RoleItem
            key={role.id}
            $active={impersonatingRole?.id === role.id}
            onClick={() => handleSelect(role)}
          >
            {role.name}
          </RoleItem>
        ))}
      </RoleList>
      {impersonatingRole && <StopItem onClick={handleStop}>Stop impersonating</StopItem>}
    </StyledPopover>
  );
};
