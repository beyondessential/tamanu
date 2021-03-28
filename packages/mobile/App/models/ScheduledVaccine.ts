import { Entity, Column, OneToMany, RelationId, MoreThan } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { AdministeredVaccine } from './AdministeredVaccine';
import { IAdministeredVaccine, IScheduledVaccine } from '~/types';
import { ReferenceDataRelation, ReferenceData } from './ReferenceData';

@Entity('scheduled_vaccine')
export class ScheduledVaccine extends BaseModel implements IScheduledVaccine {
  @Column({ nullable: true })
  index?: number;

  @Column({ default: '' })
  label: string;

  @Column({ default: '' })
  schedule: string;

  @Column({ nullable: true })
  weeksFromBirthDue?: number;

  @Column({ default: '' })
  category: string;

  @ReferenceDataRelation()
  vaccine: ReferenceData

  @RelationId(({ vaccine }) => vaccine)
  vaccineId?: string;

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.scheduledVaccine)
  administeredVaccines: AdministeredVaccine[];

  static async getNextVaccineCalendar(id: string):
  Promise<ScheduledVaccine> {
    const vaccine = await this.findOne({ id });

    const repo = this.getRepository();
    const query = repo.createQueryBuilder('scheduled_vaccine')
      .where('vaccineId = :vaccineId and "index" > :index', { vaccineId: vaccine.vaccineId, index: vaccine.index })
      .orderBy('"index"');

    return query.getOne();
  }
}
