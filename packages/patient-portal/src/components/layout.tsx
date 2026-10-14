import React from 'react';
import styled, { createGlobalStyle, css } from 'styled-components';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { patientFormPalette, TranslatedText } from '@tamanu/ui-components';

/**
 * The portal shares the kiosk's palette and form controls, at phone size: `--pf-scale` shrinks
 * the shared controls, so they stay large enough to tap without looking oversized.
 */
export const PortalRoot = styled.div`
  ${patientFormPalette}
  --pf-scale: 0.8;
  --pf-radius: 12px;

  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--pf-page);
  color: var(--pf-text);
  font-family: Roboto, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button {
    font-family: inherit;
  }

  :focus-visible {
    outline: 3px solid var(--pf-primary);
    outline-offset: 2px;
  }
`;

/** Messages like "Details saved" span a phone's width rather than running off its edge. */
export const PortalGlobalStyle = createGlobalStyle`
  @media (max-width: 480px) {
    .Toastify__toast-container {
      inset-inline: 8px !important;
      min-inline-size: 0 !important;
      max-inline-size: none !important;
      inline-size: auto !important;
    }

    .Toastify__toast {
      min-inline-size: 0 !important;
      max-inline-size: none !important;
      inline-size: auto !important;
      margin-block-end: 8px;
    }
  }
`;

/** One column of content, the width of a phone and kept readable on a desktop. */
export const PageColumn = styled.main`
  flex: 1;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 16px 16px 40px;
`;

export const PageTitle = styled.h1`
  margin: 4px 0 20px;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: var(--pf-heading);
`;

const BackLinkFrame = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  margin: -4px 0 0 -8px;
  padding: 0 12px 0 4px;
  border-radius: 10px;
  color: var(--pf-primary);
  font-weight: 500;
  text-decoration: none;

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const BackLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <BackLinkFrame to={to}>
    <ChevronLeft aria-hidden />
    {children}
  </BackLinkFrame>
);

export const Section = styled.section`
  /* Clear of the sticky header when scrolled to */
  scroll-margin-top: 72px;

  & + & {
    margin-top: 28px;
  }
`;

export const SectionTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 500;
  color: var(--pf-text);
`;

/** The white outlined surface content sits on, as at the kiosk. */
export const Panel = styled.div`
  background: var(--pf-surface);
  border: var(--pf-border) solid var(--pf-outline);
  border-radius: 14px;
  overflow: hidden;

  & + & {
    margin-top: 10px;
  }
`;

/** A row's spacing, shared by plain rows, rows that link and rows that expand. */
export const rowLayout = css`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  padding: 12px 16px;

  & + & {
    border-top: 1px solid var(--pf-line);
  }
`;

export const Row = styled.div`
  ${rowLayout}
`;

const RowLinkFrame = styled(Link)`
  ${rowLayout}
  color: inherit;
  text-decoration: none;

  &:active {
    background: var(--pf-option);
  }

  > svg:last-child {
    flex: none;
    width: 20px;
    height: 20px;
    color: var(--pf-text-tertiary);
  }
`;

/** A row that opens another page, ending in a chevron. */
export const RowLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <RowLinkFrame to={to}>
    {children}
    <ChevronRight aria-hidden />
  </RowLinkFrame>
);

export const RowIcon = styled.span<{ $tone?: 'primary' | 'alert' | 'success' }>`
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $tone = 'primary' }) =>
    `var(--pf-${$tone === 'primary' ? 'primary' : $tone}-tint)`};
  color: var(--pf-${({ $tone = 'primary' }) => $tone});

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const RowText = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const RowTitle = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: var(--pf-text);
`;

export const RowDetail = styled.span`
  font-size: 14px;
  color: var(--pf-text-secondary);
`;

export const Muted = styled.p`
  margin: 0;
  padding: 18px 16px;
  color: var(--pf-text-secondary);
`;

const BADGE_TONES = {
  neutral: 'var(--pf-option)',
  info: 'var(--pf-info-tint)',
  success: 'var(--pf-success-tint)',
  alert: 'var(--pf-alert-tint)',
  warning: '#faf0e6',
} as const;

const BADGE_TEXT = {
  neutral: 'var(--pf-text-secondary)',
  info: 'var(--pf-info)',
  success: 'var(--pf-success)',
  alert: 'var(--pf-alert)',
  warning: '#cb6100',
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export const Badge = styled.span<{ $tone?: BadgeTone }>`
  flex: none;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  background: ${({ $tone = 'neutral' }) => BADGE_TONES[$tone]};
  color: ${({ $tone = 'neutral' }) => BADGE_TEXT[$tone]};
`;

export const Loading = () => (
  <Muted role="status">
    <TranslatedText stringId="general.status.loading" fallback="Loading…" />
  </Muted>
);
