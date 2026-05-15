import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts';

const OrnamentRoot = styled.span`
  &::after {
    content: '*' / '${p => p.altText}';
  }
`;

/**
 * Renders as *, but with accessible label for screen readers
 * @param {React.ComponentPropsWithRef<typeof OrnamentRoot> & { altText?: string }} props
 */
export function EditedOrnament(props) {
  const { getTranslation } = useTranslation();
  return <OrnamentRoot altText={getTranslation('general.label.edited', 'Edited')} {...props} />;
}
