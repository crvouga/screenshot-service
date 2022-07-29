import dayjs from 'dayjs';

export type DateRange = {
  start: string;
  end: string;
};

export const getDateRangeToday = (): DateRange => {
  const start = dayjs().startOf('day').toISOString();
  const end = dayjs().endOf('day').toISOString();
  return {
    start,
    end,
  };
};
