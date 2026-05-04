import ms, { StringValue } from 'ms';

export const parseTtlToDate = (ttl: StringValue): Date => {
  const msValue = ms(ttl);

  return new Date(Date.now() + msValue);
};
