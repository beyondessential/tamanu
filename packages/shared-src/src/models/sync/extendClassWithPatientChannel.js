export const extendClassWithPatientChannel = name => {
  const channelRegex = new RegExp(`patient\/([^\/]+)\/${name}`);
  return {
    async getChannels() {
      const ids = await this.sequelize.models.Patient.getSyncIds();
      return ids.map(id => `patient/${id}/${name}`);
    },
    syncParentIdFromChannel(channel) {
      return channel.match(channelRegex)[1];
    },
    syncParentIdKey: 'patientId',
  };
};
