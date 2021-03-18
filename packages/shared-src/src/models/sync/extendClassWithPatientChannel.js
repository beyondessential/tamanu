export const extendClassWithPatientChannel = (model, name) => {
  // add channel methods and properties
  const channelRegex = new RegExp(`patient\/([^\/]+)\/${name}`);
  Object.assign(model, {
    async getChannels() {
      const ids = await this.sequelize.models.Patient.getSyncIds();
      return ids.map(id => `patient/${id}/${name}`);
    },
    syncParentIdFromChannel(channel) {
      return channel.match(channelRegex)[1];
    },
    syncParentIdKey: 'patientId',
  });
};
