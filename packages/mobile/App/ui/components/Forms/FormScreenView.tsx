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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
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
  arrowContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    setContentHeight(h);
  }, []);

  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setLayoutHeight(nativeEvent.layout.height);
  }, []);

  useEffect(() => {
    if (contentHeight > 0 && layoutHeight > 0) {
      const contentBiggerThanScreen =
        contentHeight - layoutHeight - scrollOffset > beginningEndOfScreenThreshold;
      setAnimated(contentBiggerThanScreen);
    }
  }, [contentHeight, layoutHeight, scrollOffset]);

  const onScroll = useCallback(
    ({ nativeEvent: { contentOffset } }: NativeSyntheticEvent<NativeScrollEvent>) => {
      setscrollOffset(contentOffset.y);
    },
    [],
  );

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
          <Animated.View style={[styles.arrowContainer, animatedStyle]}>
            <ArrowDownIcon
              size={screenPercentageToDP(4.86, Orientation.Height)}
              fill={theme.colors.PRIMARY_MAIN}
            />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  );
};
