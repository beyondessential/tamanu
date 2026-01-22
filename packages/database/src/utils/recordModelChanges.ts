import { Model } from '../models/Model';

/**
 * Creates helper functions for recording model changes in update methods.
 * These functions track changes to model fields and generate system note messages.
 *
 * @param modelInstance - The model instance being updated (this)
 * @param updateData - The data object containing the new values
 * @param systemNoteRows - Array to collect system note messages
 * @param changeTypes - Optional array to collect change types for history tracking (soon to be deprecated)
 * @returns Object containing recordForeignKeyChange and recordTextColumnChange functions
 */
export function createChangeRecorders<T extends Model>(
  modelInstance: T,
  updateData: Partial<T>,
  systemNoteRows: string[],
  changeTypes?: string[],
) {
  /**
   * Records changes to foreign key columns (e.g., locationId, departmentId)
   * Fetches the related records to get human-readable names for the system note
   */
  const onChangeForeignKey = async ({
    columnName,
    noteLabel,
    model,
    sequelizeOptions = {},
    accessor = (record: typeof Model) => record?.name ?? '-',
    changeType,
    onChange,
  }: {
    columnName: keyof T;
    noteLabel: string;
    model: typeof Model;
    sequelizeOptions?: any;
    accessor?: (record: any) => string;
    changeType?: string;
    onChange?: () => Promise<void>;
  }) => {
    const isChanged =
      columnName in updateData && updateData[columnName] !== modelInstance[columnName];
    if (!isChanged) return;

    if (changeType && changeTypes) {
      changeTypes.push(changeType);
    }

    const oldRecord = await model.findByPk(modelInstance[columnName] as any, sequelizeOptions);
    const newRecord = await model.findByPk(updateData[columnName] as any, sequelizeOptions);

    systemNoteRows.push(
      `Changed ${noteLabel} from ‘${accessor(oldRecord)}’ to ‘${accessor(newRecord)}’`,
    );
    await onChange?.();
  };

  /**
   * Records changes to text/string columns (e.g., encounterType, reasonForEncounter)
   * Uses the raw values directly since there's no related record to fetch
   */
  const onChangeTextColumn = async ({
    columnName,
    noteLabel,
    formatText = (value: any) => value ?? '-',
    changeType,
    onChange,
  }: {
    columnName: keyof T;
    noteLabel: string;
    formatText?: (value: any) => string;
    changeType?: string;
    onChange?: () => Promise<void>;
  }) => {
    const isChanged =
      columnName in updateData && updateData[columnName] !== modelInstance[columnName];
    if (!isChanged) return;

    if (changeType && changeTypes) {
      changeTypes.push(changeType);
    }

    const oldValue = modelInstance[columnName];
    const newValue = updateData[columnName];
    systemNoteRows.push(
      `Changed ${noteLabel} from ‘${formatText(oldValue)}’ to ‘${formatText(newValue)}’`,
    );
    await onChange?.();
  };

  return {
    onChangeForeignKey,
    onChangeTextColumn,
  };
}
