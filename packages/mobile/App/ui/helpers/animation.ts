import { timing, Easing, Clock, set, cond, and, eq, block, clockRunning, startClock, Node, Value } from 'react-native-reanimated';

/**
 * Uses an Animated State to change during the specified period of time.
 */
export const animateState = (
  animatedValue: Value<number>,
  toValue: number,
  duration: number,
): void => {
  timing(animatedValue, {
    duration,
    toValue,
    easing: Easing.in(Easing.linear),
  }).start();
};

export const runTiming = (clock: Clock, value: number, dest: number): Node<number> => {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    frameTime: new Value(0),
  };

  const config = {
    duration: 500,
    toValue: new Value(0),
    easing: Easing.inOut(Easing.ease),
  };

  const reset = [
    set(state.finished, 0),
    set(state.time, 0),
    set(state.frameTime, 0),
  ];

  return block([
    cond(and(state.finished, eq(state.position, value)), [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(and(state.finished, eq(state.position, dest)), [
      ...reset,
      set(config.toValue, value),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    timing(clock, state, config),
    state.position,
  ]);
};
