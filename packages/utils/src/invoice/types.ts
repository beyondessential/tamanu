import Decimal from 'decimal.js';

export interface Product {
  id?: string;
  name?: string;
  insurable?: boolean;
  invoicePriceListItem?: {
    price?: number;
  };
}

export interface InvoiceDiscount {
  id?: string;
  percentage?: number;
}

export interface InvoiceItemDiscount {
  id?: string;
  type?: string;
  amount?: number;
}

export interface InsurancePlanItem {
  id: string;
  name?: string;
  code?: string;
  coverageValue?: number;
}

export interface FinalisedInsurance {
  invoiceInsurancePlanId: string;
  coverageValueFinal: number;
}

export interface InvoiceItem {
  id?: string;
  priceFinal?: number;
  manualEntryPrice?: number;
  quantity?: number;
  product?: Product;
  discount?: InvoiceItemDiscount;
  insurancePlanItems?: InsurancePlanItem[];
  finalisedInsurances?: FinalisedInsurance[];
}

export interface PatientPayment {
  id: string;
}

export interface InsurerPayment {
  id: string;
  insurerId?: string;
}

export interface Payment {
  id?: string;
  amount: number | Decimal;
  patientPayment?: PatientPayment;
  insurerPayment?: InsurerPayment;
}

export interface Invoice {
  id?: string;
  status?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  insurancePlans?: InsurancePlanItem[];
  discount?: InvoiceDiscount;
}

export interface InvoiceSummary {
  invoiceItemsUndiscountedTotal: number;
  invoiceItemsTotal: number;
  insuranceCoverageTotal: number;
  patientTotal: number;
  discountTotal: number;
  itemAdjustmentsTotal: number;
  patientSubtotal: number;
  patientPaymentsTotal: number;
  insurerPaymentsTotal: number;
  paymentsTotal: number;
  patientPaymentRemainingBalance: number;
  insurerPaymentRemainingBalance: number;
}
