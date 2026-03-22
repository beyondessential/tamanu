import { DataTypes } from 'sequelize';
import { INVOICE_ITEMS_CATEGORIES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';
import { ReferenceData } from '../ReferenceData';
import { LabTestType } from '../LabTestType';
import { LabTestPanel } from '../LabTestPanel';

export class InvoiceProduct extends Model {
  declare id: string;
  declare name: string;
  declare insurable: boolean;
  declare category?: string;
  declare sourceRecordType?: string;
  declare sourceRecordId?: string;
  declare visibilityStatus: string;

  declare sourceRefDataRecord?: ReferenceData;
  declare sourceLabTestTypeRecord?: LabTestType;
  declare sourceLabTestPanelRecord?: LabTestPanel;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        insurable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sourceRecordType: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sourceRecordId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        visibilityStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'sourceRecordId',
      as: 'sourceRefDataRecord',
    });
    this.belongsTo(models.LabTestPanel, {
      foreignKey: 'sourceRecordId',
      as: 'sourceLabTestPanelRecord',
    });
    this.belongsTo(models.LabTestType, {
      foreignKey: 'sourceRecordId',
      as: 'sourceLabTestTypeRecord',
    });
    // Has many in the context of importing and storing data
    this.hasMany(models.InvoicePriceListItem, {
      foreignKey: 'invoiceProductId',
      as: 'invoicePriceListItems',
    });
    // Has one in the context of fetching data from the api
    this.hasOne(models.InvoicePriceListItem, {
      foreignKey: 'invoiceProductId',
      as: 'invoicePriceListItem',
    });
    this.hasMany(models.InvoiceInsurancePlanItem, {
      foreignKey: 'invoiceProductId',
      as: 'invoiceInsurancePlanItems',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  static getFullReferenceAssociations() {
    return ['invoicePriceListItems'];
  }

  getSourceRecord() {
    switch (this.category) {
      case INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE:
      case INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE:
      case INVOICE_ITEMS_CATEGORIES.IMAGING_AREA:
      case INVOICE_ITEMS_CATEGORIES.DRUG:
        return this.sourceRefDataRecord;
      case INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE:
        return this.sourceLabTestTypeRecord;
      case INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL:
        return this.sourceLabTestPanelRecord;
      default:
        return (
          this.sourceRefDataRecord ||
          this.sourceLabTestTypeRecord ||
          this.sourceLabTestPanelRecord ||
          null
        );
    }
  }

  getProductCode(): string | null {
    const sourceRecord = this.getSourceRecord();
    return sourceRecord?.code || null;
  }
}
