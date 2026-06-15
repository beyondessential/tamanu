export const getDeviceId = () => {
  const deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    const newDeviceId = `patient-portal-${crypto.randomUUID()}`;
    localStorage.setItem('deviceId', newDeviceId);
    return newDeviceId;
  }
  return deviceId;
};
