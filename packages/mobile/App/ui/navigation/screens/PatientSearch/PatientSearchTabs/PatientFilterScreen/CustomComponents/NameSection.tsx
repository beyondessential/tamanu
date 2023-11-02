import React, { ReactElement } from 'react';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { TextField } from '~/ui/components/TextField/TextField';

export const NameSection = (): ReactElement => (
         <StyledView marginTop={30}>
           <StyledView marginLeft={20} marginRight={20}>
             <LocalisedField labelFontSize={14} component={TextField} name="firstName" />
           </StyledView>
           <StyledView marginLeft={20} marginRight={20}>
             <LocalisedField labelFontSize={14} component={TextField} name="lastName" />
           </StyledView>
         </StyledView>
       );
