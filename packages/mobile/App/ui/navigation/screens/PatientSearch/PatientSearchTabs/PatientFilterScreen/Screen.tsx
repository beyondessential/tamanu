import React, { ReactElement } from 'react';
import { Button } from '/components/Button';
import {
  StyledText,
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledView,
  StyledScrollView,
} from '/styled/common';
import { theme } from '/styled/theme';
import { SexSection, DateSection, NameSection, VillageSection } from './CustomComponents';
import SubmitSection from './CustomComponents/SubmitSection';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

interface ScreenProps {
  onCancel: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

export const Screen = ({ onSubmit, onClear, onCancel }: ScreenProps): ReactElement => (
         <FullView>
           <StyledSafeAreaView>
             <RowView
               background={theme.colors.PRIMARY_MAIN}
               height={70}
               justifyContent="space-between"
               alignItems="center"
             >
               <Button
                 onPress={onCancel}
                 backgroundColor="transparent"
                 width={screenPercentageToDP(10, Orientation.Width)}
                 marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
               >
                 <StyledText color={theme.colors.BOX_OUTLINE} fontSize={12}>
                   Cancel
                 </StyledText>
               </Button>

               <StyledText fontSize={18} color={theme.colors.WHITE}>
                 Filter Search
               </StyledText>

               <Button
                 onPress={onClear}
                 backgroundColor="transparent"
                 width={screenPercentageToDP(20, Orientation.Width)}
                 marginRight={screenPercentageToDP(2.43, Orientation.Width)}
               >
                 <StyledText color={theme.colors.BOX_OUTLINE} fontSize={12}>
                   Clear Filters
                 </StyledText>
               </Button>
             </RowView>
           </StyledSafeAreaView>
           <StyledScrollView keyboardShouldPersistTaps="never">
             <FullView background={theme.colors.WHITE}>
               <NameSection />
               <DateSection />
               <VillageSection />
               <SexSection />
               <SubmitSection onSubmit={onSubmit} />
             </FullView>
           </StyledScrollView>
         </FullView>
       );
