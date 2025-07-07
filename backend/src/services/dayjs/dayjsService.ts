import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import duration from 'dayjs/plugin/duration.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import weekday from 'dayjs/plugin/weekday.js';
import updateLocale from 'dayjs/plugin/updateLocale.js';
import 'dayjs/locale/de';

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(weekday);
dayjs.extend(updateLocale);

dayjs.locale(`de`);
dayjs.updateLocale(`de`, {
  weekStart: 1
});

export { dayjs };