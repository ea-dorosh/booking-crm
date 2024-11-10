import { createSelector } from '@reduxjs/toolkit';
import { orderBy } from 'lodash';
import { CUSTOMERS_SORT_RULE } from '@/constants/sorting';

const data = state => state.customers.data;
const sortRule = state => state.customers.sortRule;
const sortDirection = state => state.customers.sortDirection;

export const selectSortedCustomers = createSelector(
  [data, sortRule, sortDirection],
  (customers, sortRule, sortDirection) => {
    let firstRule;
    let secondRule;

    if (sortRule === CUSTOMERS_SORT_RULE.LAST_NAME) {
      firstRule = CUSTOMERS_SORT_RULE.LAST_NAME;
      secondRule = CUSTOMERS_SORT_RULE.FIRST_NAME;
    }

    if (sortRule === CUSTOMERS_SORT_RULE.FIRST_NAME) {
      firstRule = CUSTOMERS_SORT_RULE.FIRST_NAME;
      secondRule = CUSTOMERS_SORT_RULE.LAST_NAME;
    }

    if (sortRule === CUSTOMERS_SORT_RULE.ADDED_DATE) {
      firstRule = CUSTOMERS_SORT_RULE.ADDED_DATE;
      secondRule = CUSTOMERS_SORT_RULE.LAST_NAME;
    }

    return orderBy(customers, [firstRule, secondRule], [sortDirection, sortDirection]);
  }
);