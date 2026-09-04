import React from 'react';
import styled from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';
import { IconButton, Tooltip } from '@material-ui/core';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { UnstyledHtmlButton } from '@tamanu/ui-components';
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
  &.Mui-disabled i {
    color: ${Colors.softText};
  }
`;

const LabelText = styled.span`
  font-size: 14px;
  line-height: 18px;
  color: ${({ $disabled }) => ($disabled ? Colors.softText : Colors.darkestText)};
`;

const CountText = styled.span`
  font-size: 14px;
  line-height: 18px;
  margin-left: 6px;
  color: ${Colors.softText};
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
  font-weight: 500;
  color: ${Colors.softText};
  padding: 8px 0 4px;
  border-bottom: 1px solid ${Colors.outline};
  margin-bottom: 2px;
`;

const MemberRow = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
  padding: 0.2rem 0 0.2rem 60px;
`;

const RemoveButton = styled(IconButton)`
  padding: 0;
  margin-left: auto;
  svg {
    font-size: 18px;
    color: ${Colors.midText};
  }
`;

const CheckboxIcons = {
  icon: <i className="far fa-square" />,
  checkedIcon: <i className="far fa-check-square" />,
};

export const CategoryHeader = ({ children, ...props }) => (
  <CategoryHeaderRow {...props}>{children}</CategoryHeaderRow>
);

export const SelectableTestRow = ({ id, label, checked, disabled, disabledTooltip, onChange }) => {
  const row = (
    <Row data-testid={`testrow-${id}`}>
      <ExpandSpacer />
      <RowLabel $disabled={disabled}>
        <StyledCheckbox
          {...CheckboxIcons}
          color="primary"
          checked={checked}
          disabled={disabled}
          onChange={event => onChange(id, event.target.checked)}
          name={id}
          data-testid={`testrow-checkbox-${id}`}
        />
        <LabelText $disabled={disabled}>{label}</LabelText>
      </RowLabel>
    </Row>
  );

  if (disabled && disabledTooltip) {
    return (
      <Tooltip title={disabledTooltip} placement="top-start" data-testid={`testrow-tooltip-${id}`}>
        <span>{row}</span>
      </Tooltip>
    );
  }
  return row;
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

export const SelectedItemRow = ({ id, label, onRemove }) => (
  <Row data-testid={`selecteditem-${id}`}>
    <LabelText>{label}</LabelText>
    <RemoveButton onClick={() => onRemove(id)} data-testid={`selecteditem-remove-${id}`}>
      <CloseIcon fontSize="inherit" />
    </RemoveButton>
  </Row>
);
