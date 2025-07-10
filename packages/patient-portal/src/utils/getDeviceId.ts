import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = () => {
  const deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    const newDeviceId = `patient-portal-${uuidv4()}`;
    localStorage.setItem('deviceId', newDeviceId);
    return newDeviceId;
  }
  return deviceId;
};
