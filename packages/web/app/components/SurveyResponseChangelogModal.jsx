import FormHelperText from '@mui/material/FormHelperText';
import React from 'react';
import styled, { css } from 'styled-components';

import {
  ContentUnavailableView,
  Modal,
  MODAL_PADDING_TOP_AND_BOTTOM,
  ModalContent,
  TranslatedText,
} from '@tamanu/ui-components';
import { useSurveyResponseChangesQuery } from '../api/queries/useSurveyResponseChangesQuery';
import { DateDisplay } from './DateDisplay';
import { ModalCancelRow } from './ModalActionRow';

function EmptyState() {
  return (
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
          fallback="This form response has not been edited before"
        />
      }
    />
  );
}

const StyledModal = styled(Modal).attrs({
  'data-testid': 'modal-survey-changelog',
  title: <TranslatedText stringId="surveyResponse.changelog.modal.title" fallback="Change log" />,
})`
  ${ModalContent} {
    padding-block: 0;
  }
`;

const ScrollView = styled.div`
  ${p => css`
    background-color: ${p.theme.palette.background.paper};
    border-radius: ${p.theme.shape.borderRadius}px;
    border: 1px solid ${p.theme.palette.divider};
  `}
  margin-block: ${MODAL_PADDING_TOP_AND_BOTTOM}px;
  overflow-y: auto;
  overflow-block: auto;
  padding-block: 12px;
  padding-inline: 40px;
`;

const ListItem = styled.li`
  padding-block: 8px;
  & + & {
    border-block-start: 1px solid ${p => p.theme.palette.divider};
  }
`;

const Heading = styled.h3`
  font: inherit;
  margin-block: 0;
`;

const Paragraph = styled.p`
  margin-block: 0.25em 0;
`;

const Muted = styled.em`
  color: ${p => p.theme.palette.text.tertiary};
`;

const Footer = styled(ModalCancelRow).attrs({
  confirmText: <TranslatedText stringId="general.action.close" fallback="Close" />,
})`
  /* <ModalCancelRow> has a slightly asinine structure */
  &,
  *:has(> &) {
    background-color: ${p => p.theme.palette.background.default};
  }
  padding-block-end: ${MODAL_PADDING_TOP_AND_BOTTOM}px;
  inset-block-end: 0;
  position: sticky;
`;

const ChangelogValue = ({ value }) => {
  if (value === null || value === undefined || value === '') return <Muted>&mdash;</Muted>;
  if (Array.isArray(value)) {
    return (
      <ul>
        {value.map((entry, i) => (
          <li key={i}>{typeof entry === 'object' ? JSON.stringify(entry) : String(entry)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const SurveyResponseChangelogModal = ({ open, surveyResponseId, onClose }) => {
  const {
    data: changes,
    isLoading,
    isError,
  } = useSurveyResponseChangesQuery(surveyResponseId, {
    enabled: open && Boolean(surveyResponseId),
  });

  return (
    <StyledModal open={open} onClose={onClose}>
      <ScrollView data-testid="response-changelog-scrollview">
        {isLoading ? (
          <TranslatedText stringId="general.table.loading" fallback="Loading…" />
        ) : isError ? (
          <TranslatedText
            stringId="surveyResponse.changelog.error.load"
            fallback="Unable to load change log"
          />
        ) : !changes?.length ? (
          <EmptyState />
        ) : (
          <ul data-testid="response-changelog-list" role="list">
            {changes.map(row => (
              <ListItem key={row.id} data-testid={`changelog-item-${row.id}`}>
                {row.fieldChanges?.map(change => {
                  return (
                    <>
                      <Heading>{/*change.fieldKey*/}Question text goes here. Foo bar baz.</Heading>
                      <Paragraph>
                        <TranslatedText
                          stringId="surveyResponse.changelog.from"
                          fallback="Edited from:"
                        />{' '}
                        <ChangelogValue value={change.from} />
                      </Paragraph>
                      <Paragraph>
                        <TranslatedText
                          stringId="surveyResponse.changelog.to"
                          fallback="Edited to:"
                        />{' '}
                        <ChangelogValue value={change.to} />
                      </Paragraph>
                    </>
                  );
                })}{' '}
                <FormHelperText>
                  {row.updatedByUser?.displayName} &middot;{' '}
                  <DateDisplay date={row.loggedAt} format="short" noTooltip timeFormat="default" />
                </FormHelperText>
              </ListItem>
            ))}
          </ul>
        )}
      </ScrollView>
      <Footer onConfirm={onClose} />
    </StyledModal>
  );
};
