import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class Patient extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
        },

        firstName: Sequelize.STRING,
        middleName: Sequelize.STRING,
        lastName: Sequelize.STRING,
        culturalName: Sequelize.STRING,

        dateOfBirth: Sequelize.DATE,
        sex: {
          type: Sequelize.ENUM('male', 'female', 'other'),
          allowNull: false,
        },
      },
      {
        ...options,
        indexes: [{ fields: ['display_id'] }, { fields: ['last_name'] }],
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Visit);

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
    });
  }
}

export class PatientIssue extends Model {

  static init({ primaryKey, ...options }) {
    super.init({
      id: primaryKey,
      note: Sequelize.STRING,
      recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
      type: {
        type: Sequelize.ENUM('issue', 'warning'),
        defaultValue: 'issue',
        allowNull: false,
      },
    }, options);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', });
  }
}

export class PatientCondition extends Model {

  static init({ primaryKey, ...options }) {
    super.init({
      id: primaryKey,
      note: Sequelize.STRING,
      recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
      resolved: { type: Sequelize.BOOLEAN, defaultValue: false },
    }, options);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', });
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', });
    this.belongsTo(models.User, { foreignKey: 'examinerId', });
  }
}

export class PatientAllergy extends Model {

  static init({ primaryKey, ...options }) {
    super.init({
      id: primaryKey,
      note: Sequelize.STRING,
      recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
    }, options);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', });
    this.belongsTo(models.User, { foreignKey: 'examinerId', });
    this.belongsTo(models.ReferenceData, { foreignKey: 'allergyId', });
  }
}

export class PatientFamilyHistory extends Model {
  
  static init({ primaryKey, ...options }) {
    super.init({
      id: primaryKey,
      note: Sequelize.STRING,
      recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
    }, options);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', });
    this.belongsTo(models.User, { foreignKey: 'examinerId', });
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', });
  }
}
