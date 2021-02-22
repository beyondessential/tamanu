export const benchmark = async (callback: () => Promise<any> | any) => {
  const start = process.hrtime.bigint();
  await callback();
  const end = process.hrtime.bigint();
  return end - start;
};
