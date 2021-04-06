import { Entity, Column, RelationId, OneToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IPatientAdditionalData } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { Patient } from './Patient';

export class PatientAdditionalData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        placeOfBirth: Sequelize.STRING,
        bloodType: Sequelize.STRING,
        primaryContactNumber: Sequelize.STRING,
        secondaryContactNumber: Sequelize.STRING,
        maritalStatus: Sequelize.STRING,
        cityTown: Sequelize.STRING,
        streetVillage: Sequelize.STRING,
        educationalLevel: Sequelize.STRING,
        socialMedia: Sequelize.STRING,
      },
      options
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    const referenceRelation = name => this.belongsTo(models.ReferenceData, {
      foreignKey: `${name}Id`,
      as: name,
    });

    referenceRelation('nationality');
    referenceRelation('country');
    referenceRelation('division');
    referenceRelation('subdivision');
    referenceRelation('medicalArea');
    referenceRelation('nursingZone');
    referenceRelation('settlement');
    referenceRelation('ethnicity');
    referenceRelation('occupation');
  }

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;
}

extendClassWithPatientChannel(PatientAdditionalData, 'additionalData');
