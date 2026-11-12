import React from 'react';
import styled from 'styled-components';
import { ListItem, ListItemText } from '@material-ui/core';
import Launch from '@mui/icons-material/Launch';

import { TranslatedText, VisuallyHidden } from '@tamanu/ui-components';

const SecondaryListItem = styled(ListItem)`
  position: relative;
  margin-bottom: 2px;
  padding: 2px 0 2px 48px;
  border-radius: 4px;

  &:hover,
  &.Mui-selected,
  &.Mui-selected:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SecondaryItemText = styled(ListItemText)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: 0;
`;

const NewTabIcon = styled(Launch)`
  && {
    font-size: 14px;
    margin-right: 12px;
    opacity: 0.8;
  }
`;

const Dot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${(props) => props.$color};
  margin-right: 14px;
`;

const OverlaidDot = styled(Dot)`
  position: absolute;
  left: 26px;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 0;
`;

export const SecondarySidebarItem = ({
  path,
  label,
  isCurrent,
  disabled,
  onClick,
  color,
  overlaidColor,
  opensInNewTab = false,
}) => {
  const dataTestIdSuffix = path.replace(/\//g, '-');
  const linkProps = opensInNewTab
    ? { component: 'a', href: path, target: '_blank', rel: 'noopener noreferrer' }
    : { to: path };
  return (
    <SecondaryListItem
      button
      {...linkProps}
      disabled={disabled}
      selected={isCurrent}
      onClick={onClick}
      data-test-class="secondary-sidebar-item"
      data-testid={`secondarylistitem${dataTestIdSuffix}`}
    >
      {color && <Dot $color={color} />}
      {overlaidColor && <OverlaidDot $color={overlaidColor} data-testid="overlaiddot-syse" />}
      <SecondaryItemText
        disableTypography
        primary={label}
        data-testid={`secondaryitemtext-${dataTestIdSuffix}`}
      />
      {opensInNewTab && (
        <>
          <NewTabIcon aria-hidden data-testid={`newtabicon${dataTestIdSuffix}`} />
          <VisuallyHidden>
            <TranslatedText stringId="general.opensInNewTab" fallback="(opens in a new tab)" />
          </VisuallyHidden>
        </>
      )}
    </SecondaryListItem>
  );
};
