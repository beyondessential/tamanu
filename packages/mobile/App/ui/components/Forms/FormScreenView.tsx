import React, {
  PropsWithChildren,
  ReactElement,
  Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
} from 'react-native';
import { FullView, StyledSafeAreaView } from '/styled/common';
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

const hasMoreContentBelow = (
  contentHeight: number,
  layoutHeight: number,
  scrollOffset: number,
): boolean =>
  contentHeight - layoutHeight - scrollOffset > beginningEndOfScreenThreshold;

export const FormScreenView = ({
  children,
  scrollViewRef,
}: PropsWithChildren<FormScreenViewProps>): ReactElement => {
  const [animated, setAnimated] = useState(false);
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const updateArrowFromRefs = useCallback(() => {
    if (contentHeightRef.current > 0 && layoutHeightRef.current > 0) {
      setAnimated(
        hasMoreContentBelow(
          contentHeightRef.current,
          layoutHeightRef.current,
          scrollOffsetRef.current,
        ),
      );
    }
  }, []);

  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeightRef.current = h;
      updateArrowFromRefs();
    },
    [updateArrowFromRefs],
  );

  const onLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      layoutHeightRef.current = nativeEvent.layout.height;
      updateArrowFromRefs();
    },
    [updateArrowFromRefs],
  );

  const onScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    scrollOffsetRef.current = contentOffset.y;
    setAnimated(
      hasMoreContentBelow(contentSize.height, layoutMeasurement.height, contentOffset.y),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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
          onMomentumScrollEnd={onScroll}
          onScrollEndDrag={onScroll}
          scrollEventThrottle={16}
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
