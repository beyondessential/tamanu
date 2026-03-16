import React from 'react';
import styled from 'styled-components';
import { ConditionalTooltip } from '../Tooltip';
import { TranslatedText } from '../Translation/TranslatedText';
import { Colors } from '../../constants/styles';

export const SurveyList = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: ${props => props.$marginBottom ?? 16}px;
`;

export const SurveyListItem = styled.div`
  padding: 10px 12px;
  cursor: ${props => (props.$disabled ? 'default' : 'pointer')};
  background: ${props => (props.$selected ? Colors.primary10 : 'transparent')};
  color: ${props => (props.$disabled ? Colors.midText : 'inherit')};
  opacity: ${props => (props.$disabled ? 0.8 : 1)};
  border-bottom: 1px solid ${Colors.outline};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props =>
      props.$disabled ? 'transparent' : props.$selected ? Colors.primary10 : Colors.hoverGrey};
  }
`;

/**
 * Renders a list of program survey options with optional tooltip for visibility-blocked items.
 *
 * @param {Object} props
 * @param {Array<{ value: string, label: React.ReactNode, disabled?: boolean, showVisibilityTooltip?: boolean }>} props.items - Survey options
 * @param {string} props.selectedValue - Currently selected survey id
 * @param {function(string): void} props.onSelect - Called when an enabled item is clicked
 * @param {number} [props.listMarginBottom=16] - Bottom margin of the list container
 */
export function ProgramSurveyList({
  items = [],
  selectedValue,
  onSelect,
  listMarginBottom = 16,
}) {
  return (
    <SurveyList data-testid="program-survey-list" $marginBottom={listMarginBottom}>
      {items.map(item => {
        const content = (
          <SurveyListItem
            key={item.value}
            $selected={selectedValue === item.value}
            $disabled={item.disabled}
            onClick={() => !item.disabled && onSelect(item.value)}
            data-testid={item.disabled ? 'program-survey-item-disabled' : 'program-survey-item'}
            role="option"
            aria-selected={selectedValue === item.value}
          >
            {item.label}
          </SurveyListItem>
        );

        if (item.disabled && item.showVisibilityTooltip) {
          return (
            <ConditionalTooltip
              key={item.value}
              visible
              title={
                <TranslatedText
                  stringId="program.formVisibility.blockedTooltip"
                  fallback="An earlier requirement in this workflow has not been completed"
                />
              }
            >
              {content}
            </ConditionalTooltip>
          );
        }

        return <React.Fragment key={item.value}>{content}</React.Fragment>;
      })}
    </SurveyList>
  );
}
