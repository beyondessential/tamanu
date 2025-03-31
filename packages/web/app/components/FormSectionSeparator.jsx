import React from 'react';
import { FormSeparatorLine } from './FormSeparatorLine';

export const FormSectionSeparator = React.memo(({ heading }) => (
  <>
    <FormSeparatorLine data-testid='formseparatorline-ncc1' />
    <div>
      <span>
        <b>{heading}</b>
      </span>
    </div>
  </>
));
