import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import {
  REPORT_DATA_SOURCES,
  REPORT_DB_SCHEMAS,
  REPORT_DEFAULT_DATE_RANGES,
  REPORT_STATUSES,
} from '@tamanu/constants/reports';
import { useNavigate } from 'react-router';
import { useApi } from '../../../api';
import { ReportEditor } from './ReportEditor';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const Container = styled.div`
  padding: 20px;
`;

export const CreateReportView = () => {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ability } = useAuth();

  const onSubmit = async ({ name, query, status, dbSchema, notes, ...queryOptions }) => {
    const { dataSources } = queryOptions;
    const isRawReport = dbSchema === REPORT_DB_SCHEMAS.RAW;
    try {
      const { reportDefinitionId, id } = await api.post('admin/reports', {
        name,
        query,
        status,
        dbSchema,
        notes,
        queryOptions: {
          ...queryOptions,
          dataSources: isRawReport ? dataSources : [REPORT_DATA_SOURCES.ALL_FACILITIES],
        },
      });
      queryClient.invalidateQueries(['reportList']);
      navigate(`/admin/reports/${reportDefinitionId}/versions/${id}/edit`);
      toast.success(
        <TranslatedText
          stringId="admin.report.notification.importedReport"
          fallback={`Imported report: ${reportDefinitionId}`}
          replacements={{ reportDefinitionId }}
          data-testid="translatedtext-apl3"
        />,
      );
    } catch (err) {
      toast.error(
        <TranslatedText
          stringId="admin.report.notification.createReportFailed"
          fallback={`Failed to create report: ${err.message}`}
          replacements={{ message: err.message }}
          data-testid="translatedtext-0gsv"
        />,
      );
    }
  };

  const canEditSchema = Boolean(ability?.can('write', 'ReportDbSchema'));

  return (
    <Container data-testid="container-i00n">
      <ReportEditor
        initialValues={{
          status: REPORT_STATUSES.PUBLISHED,
          dataSources: [REPORT_DATA_SOURCES.ALL_FACILITIES],
          defaultDateRange: REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS,
          dbSchema: canEditSchema ? REPORT_DB_SCHEMAS.RAW : null,
          parameters: [],
        }}
        onSubmit={onSubmit}
        data-testid="reporteditor-kh3x"
      />
    </Container>
  );
};
