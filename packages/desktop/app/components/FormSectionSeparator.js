import { FormSeparatorLine } from './FormSeparatorLine';
import React from 'react'

export const FormSectionSeparator = React.memo(({ heading }) => (
  <>
    <FormSeparatorLine />
    <div><span><b>{ heading }</b></span></div>
  </>
));