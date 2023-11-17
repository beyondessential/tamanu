import React, { ReactElement, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getUniqueId } from 'react-native-device-info';

import { RowView, StyledView, StyledText, FullView, CenterView } from '/styled/common';
import { screenPercentageToDP, Orientation, setStatusBar } from '/helpers/screen';
import { theme } from '/styled/theme';
import { UserAvatar } from '/components/UserAvatar';
import { Button } from '/components/Button';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { FlatList } from 'react-native-gesture-handler';
import { CameraOutlineIcon, FeedbackIcon, QuestionIcon, RingIcon, LaunchIcon } from '/components/Icons';
import { version as AppVersion } from '/root/package.json';
import { Linking } from 'react-native';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { authUserSelector } from '/helpers/selectors';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';

const CameraInCircle = (
  <StyledView position="absolute" right="-20%" bottom={0} zIndex={2}>
    <CenterView
      borderRadius={50}
      paddingTop={screenPercentageToDP('0.97', Orientation.Height)}
      paddingLeft={screenPercentageToDP('0.97', Orientation.Height)}
      paddingRight={screenPercentageToDP('0.97', Orientation.Height)}
      paddingBottom={screenPercentageToDP('0.97', Orientation.Height)}
      background={theme.colors.TEXT_SOFT}
    >
      <CameraOutlineIcon
        height={screenPercentageToDP('2.43', Orientation.Height)}
        width={screenPercentageToDP('2.43', Orientation.Height)}
        fill={theme.colors.WHITE}
      />
    </CenterView>
  </StyledView>
);

type FooterProps = {
  version: string;
  deviceId: string;
};

const Footer = ({ version, deviceId }: FooterProps): ReactElement => (
  <StyledText
    marginTop={screenPercentageToDP(2.43, Orientation.Height)}
    marginLeft={screenPercentageToDP(4.86, Orientation.Width)}
    color={theme.colors.TEXT_MID}
    fontSize={screenPercentageToDP(1.45, Orientation.Height)}
  >
    Tamanu Version {version}
    {'\n'}Device ID mobile-{deviceId}
  </StyledText>
);

export const MoreScreen = ({ navigation }: BaseAppProps): ReactElement => {
  const { getLocalisation } = useLocalisation();
  const supportDeskUrl = getLocalisation('supportDeskUrl');
  const authCtx = useAuth();
  const user = useSelector(authUserSelector);
  const { facilityName } = useFacility();
  const settings = useMemo(
    () => [
      {
        title: 'Support centre',
        Icon: LaunchIcon,
        onPress: (): Promise<void> => Linking.openURL(supportDeskUrl),
      },
    ],
    [],
  );

  const signOut = useCallback(() => {
    authCtx.signOut();
  }, []);

  setStatusBar('dark-content', theme.colors.BACKGROUND_GREY);

  return (
    <FullView>
      <CenterView
        height={screenPercentageToDP(31.59, Orientation.Height)}
        paddingTop={screenPercentageToDP(4.86, Orientation.Height)}
        background={theme.colors.BACKGROUND_GREY}
      >
        <UserAvatar
          size={screenPercentageToDP(9.72, Orientation.Height)}
          displayName={user.displayName}
          Icon={CameraInCircle}
        />
        <StyledText
          fontSize={screenPercentageToDP(2.55, Orientation.Height)}
          color={theme.colors.TEXT_SUPER_DARK}
          fontWeight="bold"
        >
          {user.displayName}
        </StyledText>
        <RowView alignItems="center">
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            color={theme.colors.TEXT_SUPER_DARK}
          >
            {user.role}
          </StyledText>
          <StyledView
            height={screenPercentageToDP(0.486, Orientation.Height)}
            width={screenPercentageToDP(0.486, Orientation.Height)}
            borderRadius={50}
            background={theme.colors.TEXT_SUPER_DARK}
            marginLeft={screenPercentageToDP(0.72, Orientation.Width)}
            marginRight={screenPercentageToDP(0.72, Orientation.Width)}
          />
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            color={theme.colors.TEXT_SUPER_DARK}
          >
            {facilityName}
          </StyledText>
        </RowView>
        <Button
          marginBottom={screenPercentageToDP(1.21, Orientation.Height)}
          marginTop={screenPercentageToDP(1.21, Orientation.Height)}
          width={screenPercentageToDP(29.19, Orientation.Width)}
          height={screenPercentageToDP(6.07, Orientation.Height)}
          buttonText="Sign out"
          onPress={signOut}
          outline
          borderColor={theme.colors.PRIMARY_MAIN}
        />
      </CenterView>
      <StyledView background={theme.colors.WHITE} flex={1}>
        <StyledView>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={settings}
            keyExtractor={(item): string => item.title}
            renderItem={({ item }): ReactElement => <MenuOptionButton {...item} />}
            ItemSeparatorComponent={Separator}
            ListFooterComponent={Separator}
          />
        </StyledView>
        <Footer version={AppVersion} deviceId={getUniqueId()} />
      </StyledView>
    </FullView>
  );
};
