import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts';

export const EditedOrnamentRoot = styled.span`
  &::after {
    content: '*' / '${p => p.altText}';
  }
`;

/**
 * Renders as *, but with accessible label for screen readers
 * @param {React.ComponentPropsWithRef<typeof EditedOrnamentRoot> & { altText?: string }} props
 */
export function EditedOrnament(props) {
  const { getTranslation } = useTranslation();
  return (
    <EditedOrnamentRoot altText={getTranslation('general.label.edited', 'Edited')} {...props} />
  );
}
