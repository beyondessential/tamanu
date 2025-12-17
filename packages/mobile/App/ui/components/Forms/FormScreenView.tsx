import React, {
  PropsWithChildren,
  ReactElement,
  Ref,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
} from 'react-native';
import { CenterView, FullView, StyledSafeAreaView } from '/styled/common';
import Animated from 'react-native-reanimated';
import { ScrollView } from 'react-native-gesture-handler';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { ArrowDownIcon } from '../Icons';

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyle: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
  },
  ScrollView: { flex: 1 },
});

type FormScreenViewProps = {
  scrollViewRef: Ref<any>;
};

const beginningEndOfScreenThreshold = 50;
export const FormScreenView = ({
  children,
  scrollViewRef,
}: PropsWithChildren<FormScreenViewProps>): ReactElement => {
  const [animated, setAnimated] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [scrollOffset, setscrollOffset] = useState(0);

  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      setContentHeight(h);
    },
    [],
  );

  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setLayoutHeight(nativeEvent.layout.height);
  }, []);

  // Formula to get current position related to end of the screen threshold
  // contentSize - size of the scrollComponent
  // offset - scroll offset so far
  // layoutSize - size of the actual layout of the component
  // layoutSize + 100%offsetavailable = contentSize
  // Check if the screen content is bigger then the ScrollContainer
  useEffect(() => {
    if (contentHeight > 0 && layoutHeight > 0) {
      const contentBiggerThanScreen =
        contentHeight - layoutHeight - scrollOffset > beginningEndOfScreenThreshold;
      if (contentBiggerThanScreen) {
        setAnimated(true);
      } else {
        setAnimated(false);
      }
    }
  }, [contentHeight, layoutHeight, scrollOffset]);

  const onScroll = useCallback(
    ({ nativeEvent: { contentOffset } }: NativeSyntheticEvent<NativeScrollEvent>) => {
      setscrollOffset(contentOffset.y);
    },
    [],
  );

  const animatedOpacity = animated ? 1 : 0;

  return (
    <StyledSafeAreaView flex={1} background={theme.colors.BACKGROUND_GREY}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.KeyboardAvoidingViewStyle}
        contentContainerStyle={styles.KeyboardAvoidingViewContainer}
      >
        <ScrollView
          onContentSizeChange={onContentSizeChange}
          onLayout={onLayout}
          onScroll={onScroll}
          scrollEventThrottle={1000}
          style={styles.ScrollView}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          scrollToOverflowEnabled
          overScrollMode="always"
        >
          <FullView margin={screenPercentageToDP(4.86, Orientation.Width)}>{children}</FullView>
        </ScrollView>
        {animated && (
          <CenterView
            as={Animated.View}
            position="absolute"
            opacity={animatedOpacity}
            zIndex={1}
            bottom={0}
            width="100%"
          >
            <ArrowDownIcon
              width={screenPercentageToDP(4.86, Orientation.Height)}
              height={screenPercentageToDP(4.86, Orientation.Height)}
              fill={theme.colors.PRIMARY_MAIN}
            />
          </CenterView>
        )}
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  );
};
