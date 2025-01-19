import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

function getServiceDuration(durationTime: string, bufferTime?: string): string {
  if (!bufferTime) return durationTime;

  const format = `HH:mm:ss`;
  const parsedTime1 = dayjs(durationTime, format);
  const parsedTime2 = dayjs(bufferTime, format);

  const totalTime = parsedTime1
    .add(parsedTime2.hour(), `hour`)
    .add(parsedTime2.minute(), `minute`)
    .add(parsedTime2.second(), `second`);

  return totalTime.format(format);
}

// form 2024-12-31T13:12:57.865Z create ISO string 2024-12-31
function toMySQLDate(string: string): string {
  return dayjs.utc(string).format(`YYYY-MM-DD`);
}


function getDueDate(dateIssued: string, daysToAdd: number): string {
  const issued = dayjs(dateIssued);
  const result = issued.add(daysToAdd, `day`);

  return result.format(`YYYY-MM-DD`);
}

export {
  getServiceDuration,
  toMySQLDate,
  getDueDate,
};
