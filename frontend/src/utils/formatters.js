/* eslint-disable no-unused-vars */
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/de';

dayjs.extend(relativeTime);
dayjs.locale(`de`);

/**
 * Formats time to a more readable format without seconds
 * @param {string} parsedTime - The time '09:00:00' number to format
 * @returns {string} - The formatted time '09:00'
 */
export const formattedTime = (parsedTime) => parsedTime.slice(0, 5);

/**
 * Formats date 2024-12-23T09:30:00.000Z to time 09:30
 * @param {string} date - The date 2024-12-23T09:30:00.000Z to format
 * @returns {string} - The formatted time '09:30'
 */
export const formattedDateToTime = (date) => {
  const time = new Date(date).toLocaleTimeString(`de-DE`, { hour: `2-digit`, minute: `2-digit` });
  return time;
};

/**
 * Formats ISO date to a more readable format
 * @param {*} dateString - The date '2021-01-01' to format
 * @returns {string} - The formatted date '01. Jan 21'
 */
export const formatIsoDate = (dateString) => {
  const date = new Date(dateString);
  const options = { month: `short`, year: `2-digit`, day: `2-digit` };
  const formattedDate = date.toLocaleDateString(`en-GB`, options);
  const [day, month, year] = formattedDate.split(` `);

  return `${day}. ${month} ${year}`;
};

/**
 * Formats ISO date to "day"
 * @param {*} dateString - The date '2021-01-01' to format
 * @returns {string} - The formatted date '01'
 */
export const getDay = (dateString) => {
  const date = new Date(dateString);
  const options = { month: `short`, year: `2-digit`, day: `2-digit` };
  const formattedDate = date.toLocaleDateString(`en-GB`, options);
  const [day, month, year] = formattedDate.split(` `);

  return day;
};

/**
 * Formats ISO date to a day of the week (Mon, Tue, Wed, etc.)
 * @param {*} dateString - The date '2021-01-01' to format
 * @returns {string} - The formatted date 'Mon'
 */
export const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  const options = { weekday: `short` };
  const formattedDate = date.toLocaleDateString(`en-GB`, options);

  return formattedDate;
};

/**
 * Formats ISO date to "month"
 * @param {*} dateString - The date '2021-01-01' to format
 * @returns {string} - 'Dec'
 */
export const getMonth = (dateString) => {
  const date = new Date(dateString);
  const options = { month: `short`, year: `2-digit`, day: `2-digit` };
  const formattedDate = date.toLocaleDateString(`en-GB`, options);
  const [day, month, year] = formattedDate.split(` `);

  return month;
};

export const formatCreatedDate = (createdDate) => {
  const date = dayjs(createdDate);
  const now = dayjs(); 

  if (!date.isValid()) {
    return "Invalid date";
  }

  const hoursDifference = now.diff(date, `hours`);

  if (hoursDifference < 1) {
    return `${now.diff(date, `minutes`)} minutes ago`;
  }

  if (hoursDifference < 24) {
    return `${hoursDifference} hours ago`;
  }

  return date.fromNow();
};

/**
 * Formats a time string into a more readable format with hours and minutes.
 * @param {string} timeStr - The time string in 'HH:MM:SS' format to format.
 * @returns {string} - The formatted time string, e.g., '1 Stunde 15 Min.' or '45 Sek.' if no hours or minutes.
 */
export const formatTimeToString = (timeStr) => {
  const [hours, minutes, seconds] = timeStr.split(`:`).map(Number);
    
  let formattedTime = ``;

  if (hours > 0) {
    formattedTime += hours === 1 ? `${hours} Stunde` : `${hours} Stunden`;
  }

  if (minutes > 0) {
    if (formattedTime) formattedTime += ' ';
    formattedTime += `${minutes} Min.`;
  }

  if (!formattedTime && seconds > 0) {
    formattedTime = `${seconds} Sek.`;
  }

  return formattedTime;
}

/**
 * Formats DATETIME from 2024-11-10T15:47:12.000Z to 10. Nov 24
 * @param {*} dateString - The date '2021-01-01' to format
 * @returns {string} - The formatted date '01. Jan 21'
 */
export const formatFromDateTimeToStringDate = (dateString) => {
  const date = new Date(dateString);
  const options = { month: `short`, year: `2-digit`, day: `2-digit` };
  const formattedDate = date.toLocaleDateString(`en-GB`, options);
  const [day, month, year] = formattedDate.split(` `);

  return `${day}. ${month} ${year}`;
};
