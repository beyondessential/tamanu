export const noTabComponent = (): null => null;

export const noSwipeGestureOnNavigator = {
  gestureEnabled: false,
};

// Navigate on a delay in order to wait for navigation to this screen to complete
export const navigateAfterTimeout = (navigation, route): void => {
  setTimeout(
    () => navigation.navigate(route),
    30,
  );
};
