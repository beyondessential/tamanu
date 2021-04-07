export const getResponseJsonSafely = async response => {
  try {
    return response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    console.error(e);
    return {};
  }
};
