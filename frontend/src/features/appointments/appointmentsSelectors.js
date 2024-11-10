import { createSelector } from '@reduxjs/toolkit';
import { orderBy } from 'lodash';

const data = state => state.appointments.data;
const sortRule = state => state.appointments.sortRule;
const sortDirection = state => state.appointments.sortDirection;

export const selectSortedAppointments = createSelector(
  [data, sortRule, sortDirection],
  (appointments, sortRule, sortDirection) => {
    return orderBy(appointments, [sortRule, `timeStart`], [sortDirection, sortDirection]);
  }
);