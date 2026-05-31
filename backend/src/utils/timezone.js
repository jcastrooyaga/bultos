const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const MADRID_TZ = 'Europe/Madrid';

/**
 * Returns the start and end of a day in Madrid timezone as UTC timestamps.
 * @param {string|Date} [date] - Date to use. Defaults to now.
 * @returns {{ startUtc: Date, endUtc: Date }}
 */
function getMadridDayBounds(date) {
  const ref = date ? dayjs(date).tz(MADRID_TZ) : dayjs().tz(MADRID_TZ);
  const startUtc = ref.startOf('day').utc().toDate();
  const endUtc = ref.endOf('day').utc().toDate();
  return { startUtc, endUtc };
}

/**
 * Converts a UTC date to Madrid local time string.
 * @param {Date|string} date
 * @param {string} [format]
 * @returns {string}
 */
function toMadridTime(date, format = 'DD/MM/YYYY HH:mm') {
  return dayjs(date).tz(MADRID_TZ).format(format);
}

module.exports = { getMadridDayBounds, toMadridTime, MADRID_TZ };
