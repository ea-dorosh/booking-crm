import { Box } from "@mui/material";
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from '../Tabs/Tabs';
import AddButton from './AddButton';
import CategoriesList from './CategoriesList';
import FilterButton from './FilterButton';
import ServicesList from './ServicesList';
import SubCategoriesList from './SubCategoriesList';
import { selectFilteredServices } from '@/features/services/servicesSelectors';

const SERVICES = `services`;
const SUB_CATEGORIES = `sub-categories`;
const CATEGORIES = `categories`;

const TABS = {
  [SERVICES]: {
    label: `Services`,
    value: SERVICES,
    url: `/services/create-service`,
    buttonText: `add service`,
  },
  [SUB_CATEGORIES]: {
    label: `Sub Categories`,
    value: SUB_CATEGORIES,
    url: `/sub-categories/create-sub-category`,
    buttonText: `add sub category`,
  },
  [CATEGORIES]: {
    label: `Categories`,
    value: CATEGORIES,
    url: `/categories/create-category`,
    buttonText: `add category`,
  },
};

export default function ServicesContainer({
  employees,
  subCategories,
  categories,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(TABS[SERVICES].value);
  const filteredServices = useSelector(selectFilteredServices);

  // Get active tab from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');

    if (tabFromUrl && TABS[tabFromUrl]) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search]);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);

    // Update URL with new tab
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('tab', newValue);
    navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });
  };

  const renderContent = () => {
    switch (activeTab) {
    case TABS[SERVICES].value:
      return <ServicesList services={filteredServices} employees={employees} categories={categories} />;
    case TABS[SUB_CATEGORIES].value:
      return <SubCategoriesList subCategories={subCategories} categories={categories} />;
    case TABS[CATEGORIES].value:
      return <CategoriesList categories={categories} />;
    default:
      return <ServicesList services={filteredServices} employees={employees} categories={categories} />;
    }
  };

  return (
    <Box>
      <Tabs
        tabs={[TABS[SERVICES], TABS[SUB_CATEGORIES], TABS[CATEGORIES]]}
        onChange={handleTabChange}
        activeTab={activeTab}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {activeTab === TABS[SERVICES].value && (
          <FilterButton employees={employees} />
        )}
        <AddButton activeTab={activeTab} tabs={TABS} />
      </Box>

      {renderContent()}
    </Box>
  );
}
