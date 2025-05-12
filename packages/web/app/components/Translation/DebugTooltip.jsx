import { Tooltip } from '@material-ui/core';
import React, { useState } from 'react';
import styled from 'styled-components';

const StyledTooltip = styled((props) => (
  <Tooltip classes={{ popper: props.className }} {...props} data-testid="tooltip-bsup">
    {props.children}
  </Tooltip>
))`
  & .MuiTooltip-tooltip {
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    background-color: white;
    color: red;
  }
  & .MuiTooltip-arrow {
    color: white;
  }
`;

const StyledList = styled.ul`
  margin: 0;
  padding-left: 20px;
  padding-bottom: 0;
`;

const DebugHighlighted = styled.span`
  background-color: red;
  color: white;
`;

export const DebugTooltip = React.memo(({ children, stringId, replacements, fallback }) => {
  const [open, setOpen] = useState(false);

  const handleOpenTooltip = (e) => {
    if (!e.shiftKey) return;
    setOpen(true);
  };
  const handleCloseTooltip = () => setOpen(false);
  return (
    <StyledTooltip
      onOpen={handleOpenTooltip}
      onClose={handleCloseTooltip}
      title={
        <>
          <b>string_id:</b> {stringId}
          {replacements && (
            <>
              <br />
              <b>replacements:</b>
              <StyledList data-testid="styledlist-adcx">
                {Object.entries(replacements).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </StyledList>
              {/** TODO: This will be the translated_string text value || fallback */}
              <b>template:</b> {fallback}
            </>
          )}
        </>
      }
      open={open}
      arrow
      placement="top"
      data-testid="styledtooltip-r5z6"
    >
      <DebugHighlighted data-testid="debughighlighted-x8q9">{children}</DebugHighlighted>
    </StyledTooltip>
  );
});
