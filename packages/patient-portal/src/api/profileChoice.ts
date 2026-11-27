const PROFILE_CHOICE_PENDING_KEY = 'profileChoicePending';

/** Whether this sign-in has yet to choose between the email's several profiles. */
export const isProfileChoicePending = () => {
  try {
    return window.localStorage.getItem(PROFILE_CHOICE_PENDING_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setProfileChoicePending = (isPending: boolean) => {
  try {
    if (isPending) {
      window.localStorage.setItem(PROFILE_CHOICE_PENDING_KEY, 'true');
    } else {
      window.localStorage.removeItem(PROFILE_CHOICE_PENDING_KEY);
    }
  } catch {
    // Without storage, the sign-in simply isn't held at Select profile
  }
};
