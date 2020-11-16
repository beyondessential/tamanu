import {
  BaseEntity,
  PrimaryColumn,
  Generated,
  UpdateDateColumn,
  CreateDateColumn,
  getRepository,
} from 'typeorm/browser';

function stripIdSuffixes(data) {
  // TypeORM expects foreign key writes to be done against just the bare name
  // of the relation, rather than "relationId", but the data is all serialised
  // as "relationId" - this just strips the "Id" suffix from any fields that
  // have them. It's a bit of a blunt instrument, but, there you go.
  return Object.entries(data)
    .reduce((state, [key, value]) => ({
      ...state,
      [key.replace(/Id$/, '')]: value,
    }), {});
}

function sanitiseForImport(repo, data) {
  const strippedIdsData = stripIdSuffixes(data);
  const columns = repo.metadata.columns.map(x => x.propertyName);
  return Object.entries(strippedIdsData)
    .filter(([key, value]) => columns.includes(key))
    .reduce((state, [key, value]) => ({
      ...state,
      [key]: value,
    }), {});
}

export abstract class BaseModel extends BaseEntity {
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static getRepository(): any {
    return getRepository(this);
  }

  static async create<T extends BaseModel>(data: any): Promise<T> {
    const repo = this.getRepository();
  
    const record = repo.create({
      ...sanitiseForImport(repo, data),
    });

    await record.save();
    return record;
  }

  static async update(data: any): Promise<void> {
    const repo = this.getRepository();
    return repo.update(data.id, sanitiseForImport(repo, data));
  }

  static async createOrUpdate(data: any): Promise<void> {
    const repo = this.getRepository();
    const existing = await repo.count({ id: data.id });
    if (existing > 0) {
      return this.update(data);
    }
    return this.create(data);
  }

}
