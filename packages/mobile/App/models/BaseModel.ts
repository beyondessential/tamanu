import {
  PrimaryColumn,
  Generated,
  Column,
} from 'typeorm/browser';
import { BaseModelWithoutId } from './BaseModelWithoutId';

export type ModelPojo = {
  id: string;
};

// https://stackoverflow.com/questions/54281631/is-it-possible-to-get-instancetypet-to-work-on-an-abstract-class
type AbstractInstanceType<T> = T extends { prototype: infer U } ? U : never;

// This is used instead of @RelationId provided by typeorm, because
// typeorm's @RelationId causes a O(n^2) operation for every query to that model.
export const IdRelation = (options = {}): any => Column({ nullable: true, ...options });

/*
  This function returns a new object (shallow copied values) and does two things:
    - Rename the keys from relation fields (countryId -> country)
    - Map the value from relation fields ( 'some-id' -> { id: 'some-id' })

  When adding relation fields, we need to point to the actual relation column
  (ManyToOne, OneToOne, etc.) and use a special syntax for TypeORM.

  Since our forms/fields/suggesters only use the ID and not the whole
  object, the field names won't match the record column names.
*/
const getMappedFormValues = (values: object): object => {
  const mappedValues = {};

  // Map keys and values accordingly
  Object.entries(values).forEach(([key, value]) => {
    // Check if field is a relation (evidenced by having 'Id' at the end)
    if (key.slice(-2) === 'Id') {
      // Remove 'Id' from the key to get the actual relation column name
      const columnKey = key.slice(0, -2);

      // Save the relation as an object to let TypeORM handle it
      mappedValues[columnKey] = { id: value };
    } else {
      // Regular field, copy as is
      mappedValues[key] = value;
    }
  });

  return mappedValues;
};

export abstract class BaseModel extends BaseModelWithoutId {

    @PrimaryColumn()
    @Generated('uuid')
    id: string;

    /*
      Helper function to properly update TypeORM relations. The .update()
      method doesn't provide a reliable way of confirming it succeeded and
      columns specified with 'IdRelation' and 'RelationId' need special handling.
    */
    static async updateValues<T extends BaseModel>(id: string, values: object): Promise<T | null> {
      const repo = this.getRepository<T>();

      // Find the actual instance we want to update
      const instance = await repo.findOne(id);

      // Bail early if no record was found
      if (!instance) {
        console.error(
          `${this.name} record with ID ${id} doesn't exist, therefore it can't be updated`,
        );
        return null;
      }

      // Get appropiate key/value pairs to manage relations
      const mappedValues = getMappedFormValues(values);

      // Update each specified value
      Object.entries(mappedValues).forEach(([key, value]) => {
        instance[key] = value;
      });

      // Return the updated instance. NOTE: updated relations won't have
      // all fields until you reload the instance again, only their ID.
      return instance.save();
    }
}
