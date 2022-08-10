export const getResponseJsonSafely = async (response: Response): Promise<Record<string, any>> => {
  try {
    return response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    console.error(e);
    return {};
  }
};
