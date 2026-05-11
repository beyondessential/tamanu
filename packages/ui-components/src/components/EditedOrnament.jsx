import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts';

export const Root = styled.span`
  &::after {
    content: '*' / '${p => p.altText}';
  }
`;

/** @param {React.ComponentPropsWithRef<typeof Root> & { altText?: string }} props */
export function EditedOrnament(props) {
  const { getTranslation } = useTranslation();
  return <Root altText={getTranslation('general.label.edited', 'Edited')} {...props} />;
}
