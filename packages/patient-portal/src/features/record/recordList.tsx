import React from 'react';
import styled from 'styled-components';
import { parseISO } from 'date-fns';
import { Badge, type BadgeTone, Loading, Muted } from '@components/layout';

const locale = globalThis.navigator?.language ?? 'default';
const mediumDateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

/** "14 Oct 2026", or nothing when there's no date. */
export const formatRecordDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  try {
    return mediumDateFormatter.format(parseISO(dateString));
  } catch {
    return null;
  }
};

const ItemRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;

  & + & {
    border-top: 1px solid var(--pf-line);
  }
`;

const ItemText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  color: var(--pf-text-secondary);

  strong {
    font-size: 16px;
    font-weight: 500;
    color: var(--pf-text);
  }
`;

/** One record: its name, a line or two of detail, and optionally a status. */
export const RecordItem = ({
  title,
  details = [],
  badge,
  badgeTone,
}: {
  title: React.ReactNode;
  details?: React.ReactNode[];
  badge?: React.ReactNode;
  badgeTone?: BadgeTone;
}) => (
  <ItemRow>
    <ItemText>
      <strong>{title}</strong>
      {details.filter(Boolean).map((detail, index) => (
        <span key={index}>{detail}</span>
      ))}
    </ItemText>
    {badge && <Badge $tone={badgeTone}>{badge}</Badge>}
  </ItemRow>
);

/** A list of records, with what to say when there are none. */
export const RecordList = <Item,>({
  items,
  isLoading,
  empty,
  renderItem,
}: {
  items: Item[] | undefined;
  isLoading: boolean;
  empty: React.ReactNode;
  renderItem: (item: Item) => React.ReactNode;
}) => {
  if (isLoading) return <Loading />;
  if (!items?.length) return <Muted>{empty}</Muted>;
  return <>{items.map(renderItem)}</>;
};

const SubsectionTitle = styled.h3`
  margin: 0;
  padding: 14px 16px 2px;
  font-size: 14px;
  font-weight: 500;
  color: var(--pf-text-secondary);
`;

/** One part of a record that is listed in two, like planned and completed procedures. */
export const RecordSubsection = ({
  id,
  title,
  children,
}: {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section aria-labelledby={id}>
    <SubsectionTitle id={id}>{title}</SubsectionTitle>
    {children}
  </section>
);
