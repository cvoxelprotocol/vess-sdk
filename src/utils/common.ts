export const convertDateToTimestampStr = (date: Date): string => {
  return Math.floor(date.getTime() / 1000).toString();
};

export const removeUndefinedFromArray = <T>(
  arr: Array<T | undefined>
): Array<T> => {
  return arr.filter((a) => a !== undefined) as Array<T>;
};
