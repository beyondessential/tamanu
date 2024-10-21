import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, styled } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

const StyledMenuItem = styled(MenuItem)`
  font-size: 0.6875rem;
  padding-inline: 0.75rem;
  padding-block: 0.25rem;
`;

export const KebabMenuButton = ({ items, ...props }) => {
  const [anchor, setAnchor] = useState(null);

  const handleKebabClick = event => {
    setAnchor(prevAnchor => (prevAnchor ? null : event.currentTarget));
  };

  return (
    <IconButton sx={{ padding: 0 }} onClick={handleKebabClick}>
      <MoreVert sx={{ fontSize: '0.875rem' }} />
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        elevation={2}
        {...props}
      >
        {items.map((item, index) => (
          <StyledMenuItem key={`kebab-menu-item-${index}`} onClick={item.onClick}>
            {item.label}
          </StyledMenuItem>
        ))}
      </Menu>
    </IconButton>
  );
};
