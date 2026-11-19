import Decimal from 'decimal.js';

export interface Product {
  id?: string;
  name?: string;
  insurable?: boolean;
  category?: string;
  invoicePriceListItem?: {
    price?: number;
    isFixedPrice?: boolean;
  };
  invoiceInsurancePlanItems?: Array<{
    invoiceInsurancePlanId: string;
    coverageValue?: number;
  }>;
}

export interface InvoiceDiscount {
  id?: string;
  percentage?: number;
  reason?: string;
  isManual?: boolean;
}

export interface InvoiceItemDiscount {
  id?: string;
  type?: string;
  amount?: number;
  reason?: string;
}

export interface InsurancePlanItem {
  id: string;
  name?: string;
  code?: string;
  label?: string;
  coverageValue?: number;
}

/** An insurance plan attached to an invoice. */
export interface InsurancePlan {
  id: string;
  name?: string;
  code?: string;
  defaultCoverage?: number;
}

export interface FinalisedInsurance {
  invoiceInsurancePlanId: string;
  coverageValueFinal: number;
}

export interface InvoiceItem {
  id?: string;
  priceFinal?: number;
  manualEntryPrice?: number;
  isFixedPriceFinal?: boolean;
  quantity?: number;
  product?: Product;
  discount?: InvoiceItemDiscount;
  insurancePlanItems?: InsurancePlanItem[];
  finalisedInsurances?: FinalisedInsurance[];
}

export interface PatientPayment {
  id: string;
}

export interface InsurancePlanPayment {
  id: string;
  invoiceInsurancePlanId?: string;
}

export interface Payment {
  id?: string;
  amount: number | Decimal;
  patientPayment?: PatientPayment;
  insurancePlanPayment?: InsurancePlanPayment;
  refundPayment?: InsurancePlanPayment;
  originalPayment?: InsurancePlanPayment;
}

export interface Invoice {
  id?: string;
  status?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  insurancePlans?: InsurancePlan[];
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
  insurancePlanPaymentsTotal: number;
  paymentsTotal: number;
  patientPaymentRemainingBalance: number;
  insurancePlanPaymentRemainingBalance: number;
}
