import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { useApi } from '../../api';
import { Colors } from '../../constants';
import { Button } from '../../components/Button';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const SEVERITY_COLORS = {
  low: Colors.safe,
  medium: Colors.alert,
  high: Colors.alert,
  critical: Colors.error,
};

const AlertBadge = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background-color: ${({ $severity }) => SEVERITY_COLORS[$severity] || Colors.midText};
`;

const PageContainer = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const COLUMNS = [
  {
    key: 'alertType',
    title: <TranslatedText stringId="patientAlert.table.column.type" fallback="Type" />,
    sortable: true,
  },
  {
    key: 'message',
    title: <TranslatedText stringId="patientAlert.table.column.message" fallback="Message" />,
  },
  {
    key: 'severity',
    title: <TranslatedText stringId="patientAlert.table.column.severity" fallback="Severity" />,
    accessor: ({ severity }) => <AlertBadge $severity={severity}>{severity}</AlertBadge>,
    sortable: true,
  },
  {
    key: 'createdAt',
    title: <TranslatedText stringId="patientAlert.table.column.createdAt" fallback="Created" />,
    accessor: ({ createdAt }) => <DateDisplay date={createdAt} />,
    sortable: true,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="patientAlert.table.column.status" fallback="Status" />,
    sortable: true,
  },
];

export const PatientAlertsView = () => {
  const api = useApi();
  const { patientId } = useParams();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const resolveAlert = useMutation({
    mutationFn: async (alertId) => {
      await api.put(`patientAlert/${alertId}`, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientAlerts', patientId]);
    },
  });

  const handleResolve = useCallback(
    (alertId) => {
      resolveAlert.mutate(alertId);
    },
    [resolveAlert],
  );

  return (
    <PageContainer>
      <Header>
        <h2>
          <TranslatedText stringId="patientAlert.title" fallback="Patient Alerts" />
        </h2>
        <Button onClick={() => setIsCreating(true)}>
          <TranslatedText stringId="patientAlert.action.create" fallback="New Alert" />
        </Button>
      </Header>
      <DataFetchingTable
        endpoint={`patientAlert?patientId=${patientId}`}
        columns={COLUMNS}
        initialSort={{ orderBy: 'createdAt', order: 'desc' }}
        noDataMessage={
          <TranslatedText stringId="patientAlert.table.noData" fallback="No alerts found" />
        }
        onRowClick={(row) => handleResolve(row.id)}
      />
    </PageContainer>
  );
};
