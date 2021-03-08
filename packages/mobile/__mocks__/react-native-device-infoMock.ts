jest.mock('react-native-device-info', () => ({
  getUniqueId: (): string => 'mockedDeviceUniqueId',
}));
