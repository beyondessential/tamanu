// The sliding fee scale setting is a row per family size, each row listing the lower bound of
// that family size's income bands. Both the patient's billing details and the invoice discount
// assessment ask the same two questions of it, and the assessment pre-fills from the answers
// saved on the patient, so they have to agree on what a family size means: the number of people
// (1 for a family of one), not the row's index.

const formatDisplayPrice = value => value.toLocaleString('en-US');

/** One option per family size the scale covers, numbered from 1. */
export const getFamilySizeOptions = (slidingFeeScale = []) =>
  slidingFeeScale.map((_, index) => {
    const familySize = String(index + 1);
    return { label: familySize, value: familySize };
  });

/**
 * The income bands for a family size, shown as a range up to the next band's lower bound, and the
 * highest band as anything above its own. Each band carries the proportion of the fee the patient
 * pays, so the discount is the remainder.
 */
export const getAnnualIncomeOptions = (slidingFeeScale = [], familySize) => {
  const incomes = slidingFeeScale[Number(familySize) - 1] || [];

  return incomes.map((income, index) => {
    const incomeDisplay = formatDisplayPrice(income);
    const range =
      index === incomes.length - 1
        ? `> ${incomeDisplay}`
        : `${incomeDisplay} - ${formatDisplayPrice(incomes[index + 1])}`;
    return { value: range, label: range, percentage: (index + 2) / 10 };
  });
};

/**
 * The bands to offer for an answer already saved against the patient. A scale the deployment has
 * since changed may no longer have that band, and it still has to read back as what was recorded,
 * so it is offered alongside the current ones until a current band is chosen in its place.
 */
export const withSavedAnnualIncome = (annualIncomeOptions, savedAnnualIncome) => {
  if (!savedAnnualIncome || annualIncomeOptions.some(({ value }) => value === savedAnnualIncome)) {
    return annualIncomeOptions;
  }
  return [...annualIncomeOptions, { value: savedAnnualIncome, label: savedAnnualIncome }];
};
