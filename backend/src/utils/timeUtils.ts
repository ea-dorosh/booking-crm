import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';

/**
 * @param dayjs - dayjs object
 * @returns string in format YYYY-MM-DD HH:mm:ss || '2025-07-10 10:00:00' UTC
 */
function fromDayjsToMySQLDateTime(dayjs: dayjs.Dayjs): string {
  return dayjs.format(`YYYY-MM-DD HH:mm:ss`);
}

function getServiceDuration(durationTime: Time_HH_MM_SS_Type, bufferTime?: Time_HH_MM_SS_Type): Time_HH_MM_SS_Type {
  // TODO: check logic with correct calculation when with real buffer time
  if (!bufferTime) return durationTime;

  const format = `HH:mm:ss`;
  const parsedTime1 = dayjs(durationTime, format);
  const parsedTime2 = dayjs(bufferTime, format);

  const totalTime = parsedTime1
    .add(parsedTime2.hour(), `hour`)
    .add(parsedTime2.minute(), `minute`)
    .add(parsedTime2.second(), `second`);

  return totalTime.format(format) as Time_HH_MM_SS_Type;
}

// form 2024-12-31T13:12:57.865Z create ISO string 2024-12-31
function toMySQLDate(string: string): string {
  return dayjs.tz(string, 'Europe/Berlin').format(`YYYY-MM-DD`);
}


function getDueDate(dateIssued: string, daysToAdd: number): string {
  const issued = dayjs.tz(dateIssued, 'Europe/Berlin');
  const result = issued.add(daysToAdd, `day`);

  return result.format(`YYYY-MM-DD`);
}

export {
  fromDayjsToMySQLDateTime,
  getServiceDuration,
  toMySQLDate,
  getDueDate,
};
