import FormHelperText, { formHelperTextClasses } from '@mui/material/FormHelperText';
import React from 'react';
import styled from 'styled-components';
import { TranslatedText } from './Translation';

const Aside = styled(FormHelperText).attrs({ component: 'aside' })`
  &.${formHelperTextClasses.root} {
    text-align: end;
  }
  &::before {
    content: '*';
  }
`;

/**
 * e.g.
 * - *Edited
 * - *Edited — view change log
 * @param {React.ComponentProps<typeof Aside>} props
 */
export function EditedLegend({ children, ...props }) {
  return (
    <Aside {...props}>
      <TranslatedText stringId="general.label.edited" fallback="Edited" />
      {children && <> &ndash; {children}</>}
    </Aside>
  );
}

/**
 * *Edited entry
 * @param {React.ComponentProps<typeof Aside>} props
 */
export function EditedEntryLegend(props) {
  return (
    <Aside {...props}>
      <TranslatedText stringId="program.table.editedEntry" fallback="Edited entry" />
    </Aside>
  );
}
