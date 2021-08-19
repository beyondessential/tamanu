export const noTabComponent = (): null => null;

export const noSwipeGestureOnNavigator = {
  gestureEnabled: false,
};

export const navigationConditionalRedirect = (shouldRedirect, route, navigation): void => {
  if (shouldRedirect) {
    // Navigate on a delay in order to wait for navigation to this screen to complete
    setTimeout(
      () => navigation.navigate(route),
      30,
    );
  }
};
