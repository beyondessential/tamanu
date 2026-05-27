import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts';

export const EditedOrnamentRoot = styled.span`
  &::after {
    content: '*' / '${p => p.$alt}';
  }
`;

/**
 * Renders as *, but with accessible label for screen readers
 * @param {React.ComponentPropsWithRef<typeof EditedOrnamentRoot> & { altText?: string }} props
 */
export function EditedOrnament({ altText, ...props }) {
  const { getTranslation } = useTranslation();
  return (
    <EditedOrnamentRoot
      $alt={altText ?? getTranslation('general.label.edited', 'Edited')}
      {...props}
    />
  );
}
