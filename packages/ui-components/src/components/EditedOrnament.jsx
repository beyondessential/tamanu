import FormHelperText from '@mui/material/FormHelperText';
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts';
import { TranslatedText } from './Translation';

const OrnamentRoot = styled.span`
  &::after {
    content: '*' / '${p => p.altText}';
  }
`;

/** @param {React.ComponentPropsWithRef<typeof OrnamentRoot> & { altText?: string }} props */
export function EditedOrnament(props) {
  const { getTranslation } = useTranslation();
  return <OrnamentRoot altText={getTranslation('general.label.edited', 'Edited')} {...props} />;
}

const LeadingOrnament = styled.span`
  &::before {
    content: '*';
  }
`;

export function EditedReference({ children, ...props }) {
  return (
    <FormHelperText component="aside" {...props}>
      <LeadingOrnament>
        <TranslatedText stringId="general.label.edited" fallback="Edited" />
      </LeadingOrnament>
      {children && <> &ndash; {children}</>}
    </FormHelperText>
  );
}
