import {
  SORT_DIRECTION,
  APPOINTMENTS_SORT_RULE,
} from '@/constants/sorting';
import { appointmentStatusEnum } from '@/enums/enums';

export const getDefaultAppointmentFilters = () => {
  const now = new Date();

  // Start date - today
  const today = now.toISOString().split('T')[0];

  // End date - one month from today
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const endDate = oneMonthLater.toISOString().split('T')[0];

  return {
    startDate: today,
    endDate: endDate,
    status: appointmentStatusEnum.active, // Show active appointments by default
    sortBy: APPOINTMENTS_SORT_RULE.DATE,
    sortOrder: SORT_DIRECTION.DESC
  };
};