const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addIndex('permissions', {
      name: 'permissions_role_id_noun_verb',
      unique: true,
      fields: ['role_id', 'noun', 'verb'],
      where: {
        object_id: {
          [Sequelize.Op.eq]: null,
        },
      },
    });
    await query.addIndex('permissions', {
      name: 'permissions_role_id_noun_verb_object_id',
      unique: true,
      fields: ['role_id', 'noun', 'verb', 'object_id'],
      where: {
        object_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },
  down: async query => {
    await query.removeIndex('permissions', 'permissions_role_id_noun_verb_object_id');
    await query.removeIndex('permissions', 'permissions_role_id_noun_verb');
  },
};
