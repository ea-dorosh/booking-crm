const dayjs = require('dayjs');

const getServiceDuration = (durationTime, bufferTime) => {
  if (!bufferTime) return durationTime;

  const format = "HH:mm:ss";
  const parsedTime1 = dayjs(durationTime, format);
  const parsedTime2 = dayjs(bufferTime, format);

  // Add the times together
  const totalTime = parsedTime1.add(parsedTime2.hour(), 'hour').add(parsedTime2.minute(), 'minute').add(parsedTime2.second(), 'second');

  return totalTime.format(format);
}

module.exports = { getServiceDuration };