/** @typedef {import('../api/queries/useSurveyResponseChangesQuery').Change} Change */

import FormHelperText from '@mui/material/FormHelperText';
import React from 'react';
import styled, { css } from 'styled-components';

import {
  ContentUnavailableView,
  Modal,
  MODAL_PADDING_TOP_AND_BOTTOM,
  ModalContent,
  TranslatedText,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { useSurveyResponseChangesQuery } from '../api/queries';
import { DateDisplay } from './DateDisplay';
import { ModalCancelRow } from './ModalActionRow';
import { SurveyAnswerResult } from './SurveyAnswerResult';

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
  .MuiPaper-root {
    overflow-y: hidden;
  }
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
  margin-block: 0 0.25em;
`;

function TableHead() {
  return (
    <VisuallyHidden as="thead">
      <tr>
        <th scope="col" />
        <th scope="col">
          <TranslatedText stringId="general.answer.label" fallback="Answer" />
        </th>
      </tr>
    </VisuallyHidden>
  );
}

const RowHeader = styled.th.attrs({ scope: 'row' })`
  font-weight: 400;
  min-inline-size: 5.6em;
  padding-inline-end: 0.2em;
  vertical-align: top;
`;

/** @param {React.ComponentProps<typeof ListItem> & { change: Change }} props */
function ChangeLogListItem({ change, ...props }) {
  return (
    <ListItem data-testid={`changelog-item-${change.id}`} {...props}>
      <Heading>{change.programDataElement.name}</Heading>
      <table>
        <TableHead />
        <tbody>
          <tr>
            <RowHeader>
              <TranslatedText stringId="surveyResponse.changelog.from" fallback="Edited from:" />
            </RowHeader>
            <td>
              <SurveyAnswerResult
                answer={change.from}
                dataElementId={change.programDataElement.id}
                type={change.programDataElement.type}
              />
            </td>
          </tr>
          <tr>
            <RowHeader>
              <TranslatedText stringId="surveyResponse.changelog.to" fallback="Edited to:" />
            </RowHeader>
            <td>
              <SurveyAnswerResult
                answer={change.to}
                dataElementId={change.programDataElement.id}
                type={change.programDataElement.type}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <FormHelperText>
        {change.updatedByUser?.displayName} &middot;{' '}
        <DateDisplay
          date={change.recordData.editedTime}
          format="short"
          noTooltip
          timeFormat="default"
        />
      </FormHelperText>
    </ListItem>
  );
}

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

/**
 * @param {React.ComponentProps<typeof StyledModal> & {
 *   surveyResponseId: import('@tamanu/database').SurveyResponse['id'];
 * }} props
 */
export const SurveyResponseChangelogModal = ({ open, surveyResponseId, onClose, ...props }) => {
  const {
    data: changes,
    isLoading,
    isError,
  } = useSurveyResponseChangesQuery(surveyResponseId, {
    enabled: open && Boolean(surveyResponseId),
  });

  return (
    <StyledModal open={open} onClose={onClose} {...props}>
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
            {changes.map(change => (
              <ChangeLogListItem change={change} key={change.id} />
            ))}
          </ul>
        )}
      </ScrollView>
      <Footer onConfirm={onClose} />
    </StyledModal>
  );
};
