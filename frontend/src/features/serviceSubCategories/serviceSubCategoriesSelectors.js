import { createSelector } from '@reduxjs/toolkit';

const selectServiceSubCategoriesData = (state) => state.serviceSubCategories.data;

// Selector for filtering sub-categories by status
export const selectSubCategoriesByStatus = createSelector(
  [selectServiceSubCategoriesData, (state, statusFilter) => statusFilter],
  (subCategories, statusFilter) => {
    if (!subCategories) {
      return subCategories;
    }

    if (statusFilter === `all`) {
      return subCategories;
    }

    return subCategories.filter(subCategory => subCategory.status === statusFilter);
  },
);
