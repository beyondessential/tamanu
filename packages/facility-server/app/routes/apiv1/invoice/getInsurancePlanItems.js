import { keyBy } from 'lodash';

export const getInsurancePlanItems = invoiceInsurancePlans => {
  return item => {
    const itemInsurancePlansById = keyBy(
      item.product?.invoiceInsurancePlanItems,
      'invoiceInsurancePlanId',
    );

    const insurancePlanItems =
      invoiceInsurancePlans?.map(({ id, code, name, defaultCoverage }) => {
        const invoiceItem = itemInsurancePlansById[id];
        const coverageValue = invoiceItem?.coverageValue ?? defaultCoverage;
        const label = name || code;
        return { id, code, name, label, coverageValue };
      }) || [];

    return { ...item, insurancePlanItems };
  };
};
