export const getPatientAuthToken = async (baseApp, email) => {
  const loginResponse = await baseApp.post('/api/portal/login').send({
    email,
  });
  expect(loginResponse).toHaveSucceeded();
  return loginResponse.body.token;
};
