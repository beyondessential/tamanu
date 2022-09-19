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
  width: 300px;
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

    // eslint-disable-next-line no-console
    console.log('Triggering manual sync on LAN server');
    toast.info('Starting manual sync...');
    try {
      await api.post(`sync/run`);
      // eslint-disable-next-line no-console
      console.log('Manual sync complete');
      toast.success('Manual sync complete');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Manual sync failed', error);
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
