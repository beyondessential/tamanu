import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import {
  REPORT_STATUSES,
  REPORT_DATA_SOURCES,
  REPORT_DEFAULT_DATE_RANGES,
} from '@tamanu/constants/reports';
import { useApi } from '../../../api';
import { ReportEditor } from './ReportEditor';

const Container = styled.div`
  padding: 20px;
`;

export const CreateReportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  const onSubmit = async ({ name, query, status, ...queryOptions }, formikContext) => {
    const { dataSources } = queryOptions;
    try {
      const { reportDefinitionId } = await api.post('admin/reports', {
        name,
        query,
        status,
        queryOptions: {
          ...queryOptions,
          dataSources: dataSources.split(','),
        },
      });
      queryClient.invalidateQueries(['reportList']);
      formikContext.resetForm();
      toast.success(`Imported report: ${reportDefinitionId}`);
    } catch (err) {
      toast.error(`Failed to create report: ${err.message}`);
    }
  };

  return (
    <Container>
      <ReportEditor
        initialValues={{
          status: REPORT_STATUSES.PUBLISHED,
          dataSources: REPORT_DATA_SOURCES.ALL_FACILITIES,
          defaultDateRange: REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS,
          parameters: [],
        }}
        onSubmit={onSubmit}
      />
    </Container>
  );
};
