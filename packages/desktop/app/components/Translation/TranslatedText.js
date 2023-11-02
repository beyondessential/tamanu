import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { Tooltip } from '@material-ui/core';
import { Colors } from '../../constants';

const DebugHighlighted = styled.span`
  background-color: red;
  color: ${Colors.white};
`;
const StyledTooltip = styled(props => (
  <Tooltip classes={{ popper: props.className }} {...props}>
    {props.children}
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    background-color: ${Colors.white};
    color: red;
  }
  & .MuiTooltip-arrow {
    color: ${Colors.white};
  }
`;

const StyledList = styled.ul`
  margin: 0;
  padding-left: 20px;
  padding-bottom: 0;
`;

const DebugTooltip = React.memo(({ children, stringId, replacements, fallback }) => {
  const [open, setOpen] = useState(false);

  const handleOpenTooltip = e => {
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
              <StyledList>
                {Object.entries(replacements).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </StyledList>
              {/* <br /> */}
              <b>template:</b> {fallback}
            </>
          )}
        </>
      }
      open={open}
      arrow
      placement="top"
    >
      {children}
    </StyledTooltip>
  );
});

const safeGetIsDebugMode = () => {
  try {
    return JSON.parse(localStorage.getItem('debugTranslation'));
  } catch (e) {
    return false;
  }
};

ipcRenderer.on('toggleTranslationDebug', () => {
  localStorage.setItem('debugTranslation', !safeGetIsDebugMode());
  window.dispatchEvent(new Event('debugTranslation'));
});

const replaceStringVariables = (templateString, replacements) => {
  const jsxElements = templateString.split(/(:[a-zA-Z]+)/g).map((part, index) => {
    // Even indexes are the unchanged parts of the string
    if (index % 2 === 0) return part;
    // Return the replacement if exists
    return replacements[part.slice(1)] || part;
  });

  return jsxElements;
};

// "stringId" is used in future functionality
// eslint-disable-next-line no-unused-vars
export const TranslatedText = ({ stringId, fallback, replacements }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  // "setTranslation" is used in future functionality
  // eslint-disable-next-line no-unused-vars
  const [translation, setTranslation] = useState(fallback);
  const [displayElements, setDisplayElements] = useState(fallback);

  // TODO: Useeffect or useQuery that fetches the translation from the backend and registers if not existing

  useEffect(() => {
    const getDebugMode = async () => {
      setIsDebugMode(safeGetIsDebugMode());
    };
    getDebugMode();

    window.addEventListener('debugTranslation', getDebugMode);
    return () => {
      window.removeEventListener('debugTranslation', getDebugMode);
    };
  }, []);

  useEffect(() => {
    if (!replacements) setDisplayElements(translation);
    setDisplayElements(replaceStringVariables(translation, replacements));
  }, [translation, replacements]);

  if (isDebugMode)
    return (
      <DebugTooltip stringId={stringId} replacements={replacements} fallback={fallback}>
        <DebugHighlighted>{displayElements}</DebugHighlighted>
      </DebugTooltip>
    );
  return displayElements;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
