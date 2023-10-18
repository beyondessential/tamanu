import {
  BeforeInsert,
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/browser';

import { IPatientFieldValue } from '~/types';
import { BaseModelWithoutId } from './BaseModelWithoutId';
import { Patient } from './Patient';
import { PatientFieldDefinition } from './PatientFieldDefinition';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_field_value')
export class PatientFieldValue extends BaseModelWithoutId implements IPatientFieldValue {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false })
  value: string;

  @Column({ nullable: true })
  id?: string;

  @ManyToOne(
    () => Patient,
    patient => patient.patientFieldValues,
  )
  patient: Patient;
  @PrimaryColumn()
  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(
    () => PatientFieldDefinition,
    patientFieldDefinition => patientFieldDefinition.patientFieldValues,
  )
  definition: PatientFieldDefinition;
  @PrimaryColumn()
  @RelationId(({ definition }) => definition)
  definitionId: string;

  @BeforeInsert()
  async assignIdAsPatientIdDefinitionId(): Promise<void> {
    // N.B. because ';' is used to join the two, we replace any actual occurrence of ';' with ':'
    // to avoid clashes on the joined id
    this.id = `${this.patient.replace(';', ':')};${this.definition.replace(';', ':')}`;
  }

  static getTableNameForSync(): string {
    return 'patient_field_values';
  }

  static async getForPatientAndDefinition(
    patientId: string,
    definitionId: string,
  ): Promise<PatientFieldValue> {
    // use a query builder instead of find, as apparently there's some
    // misbehaviour around how typeorm traverses this relation
    return await PatientFieldValue.getRepository()
      .createQueryBuilder('patient_field_value')
      .where('patient_field_value.patientId = :patientId', { patientId })
      .andWhere('patient_field_value.definitionId = :definitionId', { definitionId })
      .getOne();
  }

  static async updateOrCreateForPatientAndDefinition(
    patientId: string,
    definitionId: string,
    value: string,
  ): Promise<PatientFieldValue> {
    const existing = await PatientFieldValue.getForPatientAndDefinition(patientId, definitionId);
    if (existing) {
      if (existing.value === value) return; // to avoid unnecessary updates
      existing.value = value ?? ''; // " ?? '' " since nullable is false
      return existing.save();
    }

    if (!value) return; // to not create a null / empty string value entry
    return PatientFieldValue.createAndSaveOne({
      patientId,
      definitionId,
      value,
    });
  }
}
