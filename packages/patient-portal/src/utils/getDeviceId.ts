export const getDeviceId = () => {
  const deviceId = window?.localStorage?.getItem('deviceId');
  if (!deviceId) {
    const newDeviceId = `patient-portal-${crypto.randomUUID()}`;
    window?.localStorage?.setItem('deviceId', newDeviceId);
    return newDeviceId;
  }
  return deviceId;
};
