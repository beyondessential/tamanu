export const patientChannelMixin = name => {
  const channelRegex = new RegExp(`patient\/([^\/]+)\/${name}`);
  return {
    getChannels() {
      return this.sequelize.models.Patient.getSyncIds.map(id => `patient/${id}/${name}`);
    },
    syncParentIdFromChannel(channel) {
      return channel.match(channelRegex)[1];
    },
    syncParentIdKey: 'patientId',
  };
};
