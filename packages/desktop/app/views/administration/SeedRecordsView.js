import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';

import { connectApi } from '../../api';
import { SeedRecordsForm } from '../../forms';

const Container = styled.div`
  padding: 32px;
`;

const DumbSeedRecordsView = memo(({ onSubmit, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(data => {
    const submitData = async () => {
      setIsLoading(true);
      await onSubmit(data);
      setIsLoading(false);
    };
    submitData();
  }, []);

  return (
    <Container>
      {isLoading ? 'Loading ... ' : <SeedRecordsForm onSubmit={handleSubmit} onCancel={onCancel} />}
    </Container>
  );
});

export const SeedRecordsView = connectApi(api => ({
  onSubmit: async data => {
    await api.put(`seed`, data);
  },
}))(DumbSeedRecordsView);
