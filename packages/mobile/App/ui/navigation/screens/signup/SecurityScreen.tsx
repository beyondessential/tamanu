import React, { ReactElement } from 'react';

import { StyledSafeAreaView, StyledText, StyledView } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Button } from '/components/Button';

interface SecurityScreenProps {
  isLoading: boolean;
  securityIssues: string[];
  handleRetry: () => void;
}

const IssueSection = ({ securityIssues }: { securityIssues: string[] }): ReactElement => {
  return (
    <StyledView marginTop={20} alignItems="flex-start">
      <StyledText
        color={theme.colors.WHITE}
        fontSize={screenPercentageToDP(1.94, Orientation.Height)}
        fontWeight={500}
        alignSelf="center"
      >
        <TranslatedText stringId="general.device.security.issues.title" fallback="Issues" />
      </StyledText>
      {securityIssues.map((issue) => (
        <StyledText key={issue} color={theme.colors.WHITE} fontSize={screenPercentageToDP(1.94, Orientation.Height)}>
          - {issue}
        </StyledText>
      ))}
    </StyledView>
  );
};

export const SecurityScreen = ({
  isLoading,
  securityIssues,
  handleRetry,
}: SecurityScreenProps): ReactElement => {
  return (
    <StyledSafeAreaView flex={1} background={theme.colors.PRIMARY_MAIN} alignItems="center">
      <StyledText
        marginTop={screenPercentageToDP('7.29', Orientation.Height)}
        color={theme.colors.WHITE}
        fontWeight="bold"
        fontSize={screenPercentageToDP('2.18', Orientation.Height)}
      >
        <TranslatedText
          stringId="general.device.security.title"
          fallback="Security check"
        />
      </StyledText>
      <StyledText
        marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
        marginRight={screenPercentageToDP('12.16', Orientation.Width)}
        textAlign="center"
        marginTop={screenPercentageToDP('1.21', Orientation.Height)}
        color={theme.colors.WHITE}
        fontSize={screenPercentageToDP(1.94, Orientation.Height)}
      >
        {isLoading
          ? <TranslatedText
            stringId="general.device.security.loading"
            fallback="Loading..."
          />
          : <TranslatedText
            stringId="general.device.security.message"
            fallback="This device does not comply with the security requirements of the tamanu system. Please contact your administrator."
          />
        }
      </StyledText>
      {securityIssues.length > 0 && (<IssueSection securityIssues={securityIssues} />)}
      {!isLoading && (
        <StyledView>
          <Button
            marginTop={20}
            backgroundColor={theme.colors.SECONDARY_MAIN}
            onPress={handleRetry}
            textColor={theme.colors.TEXT_SUPER_DARK}
            fontSize={screenPercentageToDP('1.94', Orientation.Height)}
            fontWeight={500}
            buttonText="Retry security check"
          />
        </StyledView>
      )}
    </StyledSafeAreaView>
  );
};
