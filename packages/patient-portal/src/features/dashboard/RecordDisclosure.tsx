import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';
import { RowIcon, rowLayout, RowText, RowTitle } from '@components/layout';

const DisclosureButton = styled.button`
  ${rowLayout}
  width: 100%;
  margin: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;

  &:active {
    background: var(--pf-option);
  }

  > svg:last-child {
    flex: none;
    width: 20px;
    height: 20px;
    color: var(--pf-text-tertiary);
    transition: transform 150ms;
  }

  &[aria-expanded='true'] > svg:last-child {
    transform: rotate(180deg);
  }
`;

const RecordContent = styled.div`
  border-top: 1px solid var(--pf-line);
`;

export const RecordPart = styled.div`
  /* Clear of the sticky header when scrolled to */
  scroll-margin-top: 72px;

  * + & {
    border-top: 1px solid var(--pf-line);
  }
`;

/** A part of the record that expands in place to show what's in it. */
export const RecordDisclosure = ({
  id,
  icon,
  title,
  detail,
  isInitiallyOpen = false,
  children,
}: {
  id: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  detail?: React.ReactNode;
  isInitiallyOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const contentId = `${id}-content`;
  return (
    <RecordPart id={id}>
      <DisclosureButton
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(open => !open)}
      >
        {icon && <RowIcon>{icon}</RowIcon>}
        <RowText>
          <RowTitle>{title}</RowTitle>
          {detail}
        </RowText>
        <ChevronDown aria-hidden />
      </DisclosureButton>
      {isOpen && <RecordContent id={contentId}>{children}</RecordContent>}
    </RecordPart>
  );
};
