import React from 'react';
import { FormSeparatorLine } from './FormSeparatorLine';

export const FormSectionSeparator = React.memo(({ heading }) => (
  <>
    <FormSeparatorLine />
    <div>
      <span>
        <b>{heading}</b>
      </span>
    </div>
  </>
));
