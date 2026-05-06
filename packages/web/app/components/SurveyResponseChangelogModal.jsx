import React from 'react';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import { ContentUnavailableView, Modal, TranslatedText } from '@tamanu/ui-components';

import { useSurveyResponseChangesQuery } from '../api/queries/useSurveyResponseChangesQuery';
import { DateDisplay } from './DateDisplay';
import { ModalCancelRow } from './ModalActionRow';

const Section = styled.div`
  margin-bottom: 16px;
`;

const ChangeBlock = styled.div`
  border-bottom: 1px solid ${p => p.theme.palette.divider};
  padding: 12px 0;
`;

const FieldRow = styled.div`
  margin-top: 8px;
  font-size: 13px;
`;

const Muted = styled.em`
  color: ${p => p.theme.palette.text.secondary};
`;

const ChangelogValue = ({ value }) => {
  if (value === null || value === undefined || value === '') {
    return (
      <Muted>
        <TranslatedText stringId="general.fallback.noAnswer" fallback="No answer" />
      </Muted>
    );
  }
  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
        {value.map((entry, i) => (
          <li key={i}>{typeof entry === 'object' ? JSON.stringify(entry) : String(entry)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    return <Typography variant="body2">{JSON.stringify(value)}</Typography>;
  }
  return <Typography variant="body2">{String(value)}</Typography>;
};

export const SurveyResponseChangelogModal = ({ open, surveyResponseId, onClose }) => {
  const { data, isLoading, isError } = useSurveyResponseChangesQuery(surveyResponseId, {
    enabled: open && Boolean(surveyResponseId),
  });

  const changes = data?.changes ?? null;

  return (
    <Modal
      title={
        <TranslatedText
          stringId="surveyResponse.changelog.modal.title"
          fallback="Change log"
          data-testid="translatedtext-changelog-title"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-survey-changelog"
    >
      {isLoading ? (
        <TranslatedText stringId="general.table.loading" fallback="Loading…" />
      ) : isError ? (
        <TranslatedText
          stringId="surveyResponse.changelog.error.load"
          fallback="Unable to load change log"
        />
      ) : !changes?.length ? (
        <ContentUnavailableView
          heading={
            <TranslatedText
              stringId="surveyResponse.changelog.empty.title"
              fallback="No edit history"
            />
          }
          description={
            <TranslatedText
              stringId="surveyResponse.changelog.empty.subtitle"
              fallback="There are no recorded changes for this form response yet"
            />
          }
        />
      ) : (
        <Section data-testid="survey-changelog-list">
          {changes.map(row => (
            <ChangeBlock key={row.id} data-testid={`changelog-row-${row.id}`}>
              <Typography variant="subtitle2">
                <DateDisplay date={row.loggedAt} format="short" timeFormat="default" />
                {row.changedBy?.displayName ? ` — ${row.changedBy.displayName}` : null}
              </Typography>
              {row.fieldChanges?.map((change, idx) => (
                <FieldRow key={`${row.id}-fc-${idx}`}>
                  <Typography variant="caption" color="textSecondary">
                    {change.fieldKey}
                  </Typography>
                  <div>
                    <TranslatedText stringId="surveyResponse.changelog.from" fallback="From" />:{' '}
                    <ChangelogValue value={change.from} />
                  </div>
                  <div>
                    <TranslatedText stringId="surveyResponse.changelog.to" fallback="To" />:{' '}
                    <ChangelogValue value={change.to} />
                  </div>
                </FieldRow>
              ))}
            </ChangeBlock>
          ))}
        </Section>
      )}
      <ModalCancelRow
        onConfirm={onClose}
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
      />
    </Modal>
  );
};
