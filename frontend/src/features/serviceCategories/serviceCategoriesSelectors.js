import { createSelector } from '@reduxjs/toolkit';

const selectServiceCategoriesData = (state) => state.serviceCategories.data;

// Selector for filtering categories by status
export const selectCategoriesByStatus = createSelector(
  [selectServiceCategoriesData, (state, statusFilter) => statusFilter],
  (categories, statusFilter) => {
    if (!categories) {
      return categories;
    }

    if (statusFilter === `all`) {
      return categories;
    }

    return categories.filter(category => category.status === statusFilter);
  },
);
