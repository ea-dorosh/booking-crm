import { Business, Category, List } from "@mui/icons-material";
import { Box, Typography, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from '../Tabs/Tabs';
import CategoriesList from './CategoriesList';
import FilterButton from './FilterButton';
import ServicesList from './ServicesList';
import SubCategoriesList from './SubCategoriesList';
import AddButton from '@/components/common/AddButton';
import { categoryStatusEnum, subCategoryStatusEnum, serviceStatusEnum } from '@/enums/enums';
import { selectCategoriesByStatus } from '@/features/serviceCategories/serviceCategoriesSelectors';
import { selectFilteredServicesByStatus } from '@/features/services/servicesSelectors';
import { selectSubCategoriesByStatus } from '@/features/serviceSubCategories/serviceSubCategoriesSelectors';

const SERVICES = `services`;
const SUB_CATEGORIES = `sub-categories`;
const CATEGORIES = `categories`;

const TABS = {
  [SERVICES]: {
    label: `Services`,
    value: SERVICES,
    url: `/services/create-service`,
    buttonText: `add service`,
    icon: <List />,
  },
  [SUB_CATEGORIES]: {
    label: `Sub Categories`,
    value: SUB_CATEGORIES,
    url: `/sub-categories/create-sub-category`,
    buttonText: `add sub category`,
    icon: <Category />,
  },
  [CATEGORIES]: {
    label: `Categories`,
    value: CATEGORIES,
    url: `/categories/create-category`,
    buttonText: `add category`,
    icon: <Business />,
  },
};

export default function ServicesContainer({ employees }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(TABS[SERVICES].value);
  const [categoryStatusFilter, setCategoryStatusFilter] = useState(categoryStatusEnum.active);
  const [subCategoryStatusFilter, setSubCategoryStatusFilter] = useState(subCategoryStatusEnum.active);
  const [serviceStatusFilter, setServiceStatusFilter] = useState(serviceStatusEnum.active);
  const filteredServices = useSelector(state => selectFilteredServicesByStatus(state, serviceStatusFilter));
  const filteredCategories = useSelector(state => selectCategoriesByStatus(state, categoryStatusFilter));
  const filteredSubCategories = useSelector(state => selectSubCategoriesByStatus(state, subCategoryStatusFilter));
  const allCategories = useSelector(state => selectCategoriesByStatus(state, `all`));

  // Get active tab from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get(`tab`);

    if (tabFromUrl && TABS[tabFromUrl]) {
      setActiveTab(tabFromUrl);
    }
    // restore categories status filter from session storage
    const storedStatus = sessionStorage.getItem(`categoriesStatusFilter`);
    if (storedStatus) {
      setCategoryStatusFilter(storedStatus);
    }
    // restore sub-categories status filter from session storage
    const storedSubStatus = sessionStorage.getItem(`subCategoriesStatusFilter`);
    if (storedSubStatus) {
      setSubCategoryStatusFilter(storedSubStatus);
    }
    // restore services status filter from session storage
    const storedServiceStatus = sessionStorage.getItem(`servicesStatusFilter`);
    if (storedServiceStatus) {
      setServiceStatusFilter(storedServiceStatus);
    }
  }, [location.search]);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);

    // Update URL with new tab
    const urlParams = new URLSearchParams(location.search);
    urlParams.set(`tab`, newValue);

    navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });
  };

  // Handlers for status filters (persist only - no backend requests)
  const handleCategoryStatusChange = (value) => {
    if (!value) return;
    setCategoryStatusFilter(value);
    sessionStorage.setItem(`categoriesStatusFilter`, value);
  };

  const handleSubCategoryStatusChange = (value) => {
    if (!value) return;
    setSubCategoryStatusFilter(value);
    sessionStorage.setItem(`subCategoriesStatusFilter`, value);
  };

  const handleServiceStatusChange = (value) => {
    if (!value) return;
    setServiceStatusFilter(value);
    sessionStorage.setItem(`servicesStatusFilter`, value);
  };

  const renderContent = () => {
    switch (activeTab) {
    case TABS[SERVICES].value:
      return (
        <ServicesList
          services={filteredServices}
          employees={employees}
          categories={filteredCategories}
          statusFilter={serviceStatusFilter}
          allCategories={allCategories}
        />
      );
    case TABS[SUB_CATEGORIES].value:
      return (
        <SubCategoriesList
          subCategories={filteredSubCategories}
          categories={filteredCategories}
          statusFilter={subCategoryStatusFilter}
          allCategories={allCategories}
        />
      );
    case TABS[CATEGORIES].value:
      return (
        <CategoriesList
          categories={filteredCategories}
          statusFilter={categoryStatusFilter}
        />
      );
    default:
      return (
        <ServicesList
          services={filteredServices}
          employees={employees}
          categories={filteredCategories}
          statusFilter={serviceStatusFilter}
        />
      );
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
    case TABS[SERVICES].value:
      return `Manage your services and their pricing`;
    case TABS[SUB_CATEGORIES].value:
      return `Organize services into sub-categories`;
    case TABS[CATEGORIES].value:
      return `Manage service categories`;
    default:
      return `Manage your services and their pricing`;
    }
  };

  return (
    <Box
      sx={{
        padding: {
          xs: 0,
          md: 3,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          marginBottom: 2,
          padding: {
            xs: 0,
            md: 0,
          },
        }}
      >
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ marginBottom: 2 }}
        >
          {getTabDescription()}
        </Typography>

        {/* Action Buttons */}
        <Box
          sx={{
            display: `flex`,
            gap: 2,
            justifyContent: `flex-end`,
            alignItems: `flex-start`,
          }}
        >
          {activeTab === TABS[SERVICES].value && (
            <FilterButton
              employees={employees}
              categories={filteredCategories}
              subCategories={filteredSubCategories}
              sx={{ mr: `auto` }}
            />
          )}

          <AddButton
            to={TABS[activeTab].url}
            size="small"
          >
            {TABS[activeTab].buttonText}
          </AddButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          marginBottom: 3,
          padding: {
            xs: 0,
            md: 0,
          },
        }}
      >
        <Tabs
          tabs={[TABS[SERVICES], TABS[SUB_CATEGORIES], TABS[CATEGORIES]]}
          onChange={handleTabChange}
          activeTab={activeTab}
        />

        {activeTab === TABS[CATEGORIES].value && (
          <ToggleButtonGroup
            value={categoryStatusFilter}
            exclusive
            onChange={(_e, value) => handleCategoryStatusChange(value)}
            size="small"
            sx={{
              mr: `auto`,
              mt: 2,
            }}
          >
            <ToggleButton
              value="all"
            >all
            </ToggleButton>
            <ToggleButton
              value={categoryStatusEnum.active}
            >active
            </ToggleButton>
            <ToggleButton
              value={categoryStatusEnum.disabled}
            >not active
            </ToggleButton>
            <ToggleButton
              value={categoryStatusEnum.archived}
            >deleted
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        {activeTab === TABS[SUB_CATEGORIES].value && (
          <ToggleButtonGroup
            value={subCategoryStatusFilter}
            exclusive
            onChange={(_e, value) => handleSubCategoryStatusChange(value)}
            size="small"
            sx={{
              mr: `auto`,
              mt: 2,
            }}
          >
            <ToggleButton value="all">all</ToggleButton>
            <ToggleButton value={subCategoryStatusEnum.active}>active</ToggleButton>
            <ToggleButton value={subCategoryStatusEnum.disabled}>not active</ToggleButton>
            <ToggleButton value={subCategoryStatusEnum.archived}>deleted</ToggleButton>
          </ToggleButtonGroup>
        )}

        {activeTab === TABS[SERVICES].value && (
          <ToggleButtonGroup
            value={serviceStatusFilter}
            exclusive
            onChange={(_e, value) => handleServiceStatusChange(value)}
            size="small"
            sx={{
              mr: `auto`,
              mt: 2,
            }}
          >
            <ToggleButton value="all">all</ToggleButton>
            <ToggleButton value={serviceStatusEnum.active}>active</ToggleButton>
            <ToggleButton value={serviceStatusEnum.disabled}>not active</ToggleButton>
            <ToggleButton value={serviceStatusEnum.archived}>deleted</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Content */}
      {renderContent()}
    </Box>
  );
}
