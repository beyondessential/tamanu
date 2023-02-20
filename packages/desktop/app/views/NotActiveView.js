import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import MuiButton from '@material-ui/core/Button';
import { useApi } from '../api';
import { TopBar, Notification } from '../components';

// adding an invisible button as a hack to allow manually triggering a sync
const InvisibleButton = styled(MuiButton)`
  height: 200px;
  width: 300px;
`;

const ErrorMessage = styled.div`
  word-break: break-word;
`;

const Error = ({ errorMessage }) => (
  <div>
    <b>Manual sync failed</b>
    <ErrorMessage>{errorMessage}</ErrorMessage>
  </div>
);

const InvisibleSyncButton = () => {
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const onClick = async () => {
    setLoading(true);

    toast.info('Starting manual sync...');
    try {
      const result = await api.post(`sync/run`, {}, {
        timeout: 30000,
      });
      toast.success(result.message);
    } catch (error) {
      toast.error(<Error errorMessage={error.message} />);
    } finally {
      setLoading(false);
    }
  };
  return <InvisibleButton onClick={onClick} disabled={loading} />;
};

export const NotActiveView = React.memo(() => (
  <>
    <TopBar title="Not active yet" />
    <Notification message="This section is not activated yet." />
    <InvisibleSyncButton />
  </>
));
