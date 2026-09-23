import React from 'react';
import styled from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ThemedTooltip, UnstyledHtmlButton } from '@tamanu/ui-components';
import { Colors } from '../../constants';

const Row = styled.div`
  display: flex;
  align-items: center;
  padding: 0.2rem 0;
  min-height: 30px;
`;

// A native label so clicking the checkbox's text toggles it, not just the box itself.
const RowLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
`;

const StyledCheckbox = styled(Checkbox)`
  padding: 0;
  margin: 0 8px 0 3px;
  i {
    font-size: 16px;
    line-height: 18px;
    color: #cccccc;
    &.fa-check-square {
      color: ${({ theme }) => theme.palette.primary.main};
    }
  }
`;

const CheckboxTooltipTarget = styled.span`
  display: inline-flex;
  align-items: center;
`;

// Honour explicit newlines in the tooltip copy so the line break lands where design wants it
const TooltipText = styled.span`
  white-space: pre-line;
`;

// Disabled rows (test already covered by a selected panel) show a filled square: the fa-square
// outline over a lighter solid fill, keeping the same geometry as the enabled rows' checkbox.
const DisabledCheckIcon = styled.span`
  position: relative;
  display: inline-flex;
  i.fas {
    color: ${Colors.softOutline};
  }
  i.far {
    position: absolute;
    top: 0;
    left: 0;
    color: ${Colors.outline};
  }
`;

const LabelText = styled.span`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
`;

const CountText = styled.span`
  font-size: 14px;
  line-height: 18px;
  margin-left: 6px;
  color: ${Colors.midText};
`;

const ExpandToggle = styled(UnstyledHtmlButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  color: ${Colors.softText};
  cursor: pointer;
  svg {
    font-size: 20px;
  }
`;

const ExpandSpacer = styled.span`
  display: inline-block;
  width: 20px;
`;

const CategoryHeaderRow = styled.div`
  font-size: 11px;
  line-height: 15px;
  color: ${Colors.midText};
  padding: 5px 0 5px 20px;
  border-bottom: 1px solid ${Colors.outline};
  border-top: 1px solid ${Colors.outline};
  margin-bottom: 2px;
  // Match the search field's divider width so the two lines are the same length
  margin-right: 1.3rem;
  // The search field's bottom border already separates the list; skip the doubled line
  &:first-child {
    border-top: none;
  }
`;

const MemberRow = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
  padding: 0.2rem 0 0.2rem 60px;
`;

// Right column (selected items) renders each category as an outlined card — a grey
// header strip over its selected rows — distinct from the plain checkbox rows in
// the left list.
export const SelectedGroupCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  & + & {
    margin-top: 8px;
  }
`;

const SelectedCategoryHeaderRow = styled.div`
  font-size: 11px;
  line-height: 15px;
  color: ${Colors.midText};
  padding: 5px 8px;
  border-bottom: 1px solid ${Colors.outline};
`;

const SelectedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: none;
  }
`;

const SelectedLabelText = styled.span`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
`;

const RemoveButton = styled(IconButton)`
  padding: 0;
  flex-shrink: 0;
  svg {
    font-size: 12px;
    color: ${Colors.midText};
  }
`;

const CheckboxIcons = {
  icon: <i className="far fa-square" />,
  checkedIcon: <i className="far fa-check-square" />,
};

const DisabledCheckboxIcon = (
  <DisabledCheckIcon>
    <i className="fas fa-square" />
    <i className="far fa-square" />
  </DisabledCheckIcon>
);

export const CategoryHeader = ({ children, ...props }) => (
  <CategoryHeaderRow {...props}>{children}</CategoryHeaderRow>
);

export const SelectableTestRow = ({ id, label, checked, disabled, disabledTooltip, onChange }) => {
  const checkbox = (
    <StyledCheckbox
      {...CheckboxIcons}
      // Disabled rows show a filled square rather than an empty checkbox
      {...(disabled && { icon: DisabledCheckboxIcon })}
      color="primary"
      checked={checked}
      disabled={disabled}
      onChange={event => onChange(id, event.target.checked)}
      name={id}
      data-testid={`testrow-checkbox-${id}`}
    />
  );

  return (
    <Row data-testid={`testrow-${id}`}>
      <ExpandSpacer />
      <RowLabel $disabled={disabled}>
        {disabled && disabledTooltip ? (
          <ThemedTooltip
            title={<TooltipText>{disabledTooltip}</TooltipText>}
            placement="top-start"
            data-testid={`testrow-tooltip-${id}`}
          >
            {/* span wrapper: a disabled checkbox emits no hover events for the tooltip */}
            <CheckboxTooltipTarget>{checkbox}</CheckboxTooltipTarget>
          </ThemedTooltip>
        ) : (
          checkbox
        )}
        <LabelText>{label}</LabelText>
      </RowLabel>
    </Row>
  );
};

export const PanelRow = ({
  id,
  label,
  testCount,
  checked,
  expanded,
  onToggleExpand,
  onChange,
  children,
}) => (
  <>
    <Row data-testid={`panelrow-${id}`}>
      <ExpandToggle
        type="button"
        aria-expanded={expanded}
        onClick={() => onToggleExpand(id)}
        data-testid={`panelrow-expand-${id}`}
      >
        {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
      </ExpandToggle>
      <RowLabel>
        <StyledCheckbox
          {...CheckboxIcons}
          color="primary"
          checked={checked}
          onChange={event => onChange(id, event.target.checked)}
          name={id}
          data-testid={`panelrow-checkbox-${id}`}
        />
        <LabelText>{label}</LabelText>
        <CountText>{testCount}</CountText>
      </RowLabel>
    </Row>
    {expanded && children}
  </>
);

export const MemberTestRow = ({ children, ...props }) => (
  <MemberRow {...props}>{children}</MemberRow>
);

export const SelectedCategoryHeader = ({ children, ...props }) => (
  <SelectedCategoryHeaderRow {...props}>{children}</SelectedCategoryHeaderRow>
);

export const SelectedItemRow = ({ id, label, onRemove }) => (
  <SelectedRow data-testid={`selecteditem-${id}`}>
    <SelectedLabelText>{label}</SelectedLabelText>
    <RemoveButton onClick={() => onRemove(id)} data-testid={`selecteditem-remove-${id}`}>
      <CloseIcon fontSize="inherit" />
    </RemoveButton>
  </SelectedRow>
);
