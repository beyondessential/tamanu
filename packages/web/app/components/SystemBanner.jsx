import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@mui/icons-material/Close';

import { useSettings } from '../contexts/Settings';
import { useTranslation } from '../contexts/Translation';
import { Colors } from '../constants';
import { LOCAL_STORAGE_KEYS } from '../constants/misc';

const SEVERITY_COLOURS = {
  info: { background: Colors.primary10, text: Colors.darkestText },
  warning: { background: Colors.secondary, text: Colors.darkestText },
  error: { background: Colors.alert, text: Colors.white },
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: ${props => SEVERITY_COLOURS[props.$severity].background};
  color: ${props => SEVERITY_COLOURS[props.$severity].text};
  border-block-end: 1px solid ${Colors.softOutline};
`;

const Message = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  white-space: pre-wrap;
`;

const DismissButton = styled(IconButton)`
  color: inherit;
  padding: 4px;
`;

const readDismissed = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.DISMISSED_BANNERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDismissed = list => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.DISMISSED_BANNERS, JSON.stringify(list));
};

// Dismissal key is derived from the content so that editing the message or
// expiry on the server resets dismissal state for every user automatically.
const dismissalKey = (message, expiresAt) => `${message}|${expiresAt ?? ''}`;

export const SystemBanner = () => {
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const banner = getSetting('banner');

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const [dismissed, setDismissed] = useState(readDismissed);

  const key = useMemo(
    () => (banner?.message ? dismissalKey(banner.message, banner.expiresAt) : null),
    [banner?.message, banner?.expiresAt],
  );

  if (!banner?.enabled) return null;
  if (!banner.message) return null;
  if (banner.expiresAt) {
    const expiry = Date.parse(banner.expiresAt);
    if (!Number.isNaN(expiry) && expiry <= now) return null;
  }
  if (key && dismissed.includes(key)) return null;

  const severity = SEVERITY_COLOURS[banner.severity] ? banner.severity : 'info';

  const handleDismiss = () => {
    if (!key) return;
    const next = [...dismissed, key];
    setDismissed(next);
    writeDismissed(next);
  };

  return (
    <Container $severity={severity} role="status" data-testid="system-banner">
      <Message>{banner.message}</Message>
      <DismissButton
        size="small"
        onClick={handleDismiss}
        aria-label={getTranslation('general.action.dismiss', 'Dismiss')}
        data-testid="system-banner-dismiss"
      >
        <CloseIcon style={{ fontSize: 18 }} />
      </DismissButton>
    </Container>
  );
};
