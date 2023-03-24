import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Avatar, CircularProgress } from '@material-ui/core';
import { useApi } from '../api';

const StyledAvatar = styled(Avatar)`
  background: #e7b091;
  font-weight: 500;
  font-size: 16px;
  margin-right: 12px;
  margin-top: 5px;
  text-transform: uppercase;
  position: relative;
`;

const ErrorMessage = styled.div`
  word-break: break-word;
`;

const CustomCircularProgress = styled(CircularProgress)`
  color: #ffffff;
`;

const Error = ({ errorMessage }) => (
  <div>
    <b>Manual sync failed</b>
    <ErrorMessage>{errorMessage}</ErrorMessage>
  </div>
);

export const HiddenSyncAvatar = ({ children, onClick, ...props }) => {
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleClick = async event => {
    if (event.shiftKey) {
      if (loading) return;
      setLoading(true);

      toast.info('Starting manual sync...');
      try {
        await api.post(`sync/run`);
        toast.success('Manual sync complete');
      } catch (error) {
        toast.error(<Error errorMessage={error.message} />);
      } finally {
        setLoading(false);
      }
    } else if (onClick) {
      onClick(event);
    }
  };

  return (
    <StyledAvatar onClick={handleClick} {...props}>
      {loading ? <CustomCircularProgress size={20} /> : children}
    </StyledAvatar>
  );
};
