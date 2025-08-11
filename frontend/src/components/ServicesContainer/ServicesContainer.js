import { Business, Category, List } from "@mui/icons-material";
import { Box, Typography, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from '../Tabs/Tabs';
import AddButton from './AddButton';
import CategoriesList from './CategoriesList';
import FilterButton from './FilterButton';
import ServicesList from './ServicesList';
import SubCategoriesList from './SubCategoriesList';
import { categoryStatusEnum, subCategoryStatusEnum } from '@/enums/enums';
import { fetchServiceCategories } from '@/features/serviceCategories/serviceCategoriesSlice';
import { selectFilteredServices } from '@/features/services/servicesSelectors';
import { fetchServiceSubCategories } from '@/features/serviceSubCategories/serviceSubCategoriesSlice';

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

export default function ServicesContainer({
  employees,
  subCategories,
  categories,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(TABS[SERVICES].value);
  const [categoryStatusFilter, setCategoryStatusFilter] = useState(categoryStatusEnum.active);
  const filteredServices = useSelector(selectFilteredServices);
  const lastRequestedStatusKeyRef = useRef(null);
  const [subCategoryStatusFilter, setSubCategoryStatusFilter] = useState(subCategoryStatusEnum.active);
  const lastRequestedSubStatusKeyRef = useRef(null);

  const requestedStatuses = useMemo(() => {
    if (categoryStatusFilter === `all`) return [categoryStatusEnum.active, categoryStatusEnum.archived, categoryStatusEnum.disabled];
    return [categoryStatusFilter];
  }, [categoryStatusFilter]);

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
  }, [location.search]);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);

    // Update URL with new tab
    const urlParams = new URLSearchParams(location.search);
    urlParams.set(`tab`, newValue);

    navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });
  };

  // persist categories status filter
  useEffect(() => {
    sessionStorage.setItem(`categoriesStatusFilter`, categoryStatusFilter);
  }, [categoryStatusFilter]);

  // fetch categories when status filter changes on Categories tab
  useEffect(() => {
    if (activeTab !== TABS[CATEGORIES].value) return;

    const statusKey = requestedStatuses.join(`,`);
    if (lastRequestedStatusKeyRef.current === statusKey && categories && categories.length) {
      return;
    }

    // avoid duplicating the initial fetch that ServicesPage already did
    if (!lastRequestedStatusKeyRef.current && categories && categories.length) {
      lastRequestedStatusKeyRef.current = statusKey;
      return;
    }

    lastRequestedStatusKeyRef.current = statusKey;
    dispatch(fetchServiceCategories(requestedStatuses));
  }, [activeTab, requestedStatuses.join(`,`), categories ? categories.length : 0]);

  const requestedSubStatuses = useMemo(() => {
    if (subCategoryStatusFilter === `all`) return [subCategoryStatusEnum.active, subCategoryStatusEnum.archived, subCategoryStatusEnum.disabled];
    return [subCategoryStatusFilter];
  }, [subCategoryStatusFilter]);

  useEffect(() => {
    sessionStorage.setItem(`subCategoriesStatusFilter`, subCategoryStatusFilter);
  }, [subCategoryStatusFilter]);

  useEffect(() => {
    if (activeTab !== TABS[SUB_CATEGORIES].value) return;

    const statusKey = requestedSubStatuses.join(`,`);
    if (lastRequestedSubStatusKeyRef.current === statusKey && subCategories && subCategories.length) {
      return;
    }

    if (!lastRequestedSubStatusKeyRef.current && subCategories && subCategories.length) {
      lastRequestedSubStatusKeyRef.current = statusKey;
      return;
    }

    lastRequestedSubStatusKeyRef.current = statusKey;
    dispatch(fetchServiceSubCategories(requestedSubStatuses));
  }, [activeTab, requestedSubStatuses.join(`,`), subCategories ? subCategories.length : 0]);

  const renderContent = () => {
    switch (activeTab) {
    case TABS[SERVICES].value:
      return <ServicesList
        services={filteredServices}
        employees={employees}
        categories={categories}
        statusFilter={categoryStatusFilter}
      />;
    case TABS[SUB_CATEGORIES].value:
      return <SubCategoriesList
        subCategories={subCategories}
        categories={categories}
        statusFilter={subCategoryStatusFilter}
      />;
    case TABS[CATEGORIES].value:
      return <CategoriesList
        categories={categories}
        statusFilter={categoryStatusFilter}
      />;
    default:
      return <ServicesList
        services={filteredServices}
        employees={employees}
        categories={categories}
        statusFilter={categoryStatusFilter}
      />;
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
      }}>
      {/* Header */}
      <Box
        sx={{
          marginBottom: 3,
          padding: {
            xs: 0,
            md: 0, 
          }, 
        }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            marginBottom: 1, 
          }}>
          {TABS[activeTab].label}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ marginBottom: 2 }}>
          {getTabDescription()}
        </Typography>

        {/* Action Buttons */}
        <Box
          sx={{
            display: `flex`,
            gap: 2,
            justifyContent: `flex-end`, 
          }}>
          {activeTab === TABS[SERVICES].value && (
            <FilterButton
              employees={employees}
              categories={categories}
              subCategories={subCategories}
              sx={{ mr: `auto` }} />
          )}

          <AddButton
            activeTab={activeTab}
            tabs={TABS} />
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
        }}>
        <Tabs
          tabs={[TABS[SERVICES], TABS[SUB_CATEGORIES], TABS[CATEGORIES]]}
          onChange={handleTabChange}
          activeTab={activeTab}
        />

        {activeTab === TABS[CATEGORIES].value && (
          <ToggleButtonGroup
            value={categoryStatusFilter}
            exclusive
            onChange={(_e, value) => value && setCategoryStatusFilter(value)}
            size="small"
            sx={{
              mr: `auto`,
              mt: 2, 
            }}
          >
            <ToggleButton
              value="all">all</ToggleButton>
            <ToggleButton
              value={categoryStatusEnum.active}>active</ToggleButton>
            <ToggleButton
              value={categoryStatusEnum.disabled}>not active</ToggleButton>
            <ToggleButton
              value={categoryStatusEnum.archived}>deleted</ToggleButton>
          </ToggleButtonGroup>
        )}

        {activeTab === TABS[SUB_CATEGORIES].value && (
          <ToggleButtonGroup
            value={subCategoryStatusFilter}
            exclusive
            onChange={(_e, value) => value && setSubCategoryStatusFilter(value)}
            size="small"
            sx={{
              mr: `auto`,
              mt: 2, 
            }}
          >
            <ToggleButton
              value="all">all</ToggleButton>
            <ToggleButton
              value={subCategoryStatusEnum.active}>active</ToggleButton>
            <ToggleButton
              value={subCategoryStatusEnum.disabled}>not active</ToggleButton>
            <ToggleButton
              value={subCategoryStatusEnum.archived}>deleted</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Content */}
      {renderContent()}

    </Box>
  );
}
