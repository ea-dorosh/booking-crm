import { Box } from "@mui/material";
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from '../Tabs/Tabs';
import AddButton from './AddButton';
import CategoriesList from './CategoriesList';
import ServicesList from './ServicesList';
import SubCategoriesList from './SubCategoriesList';

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
  services,
  subCategories,
  categories,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(TABS[SERVICES].value);

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
      return <ServicesList services={services} />;
    case TABS[SUB_CATEGORIES].value:
      return <SubCategoriesList subCategories={subCategories} categories={categories} />;
    case TABS[CATEGORIES].value:
      return <CategoriesList categories={categories} />;
    default:
      return <ServicesList services={services} />;
    }
  };

  return (
    <Box>
      <Tabs
        tabs={[TABS[SERVICES], TABS[SUB_CATEGORIES], TABS[CATEGORIES]]}
        onChange={handleTabChange}
        activeTab={activeTab}
      />

      <AddButton activeTab={activeTab} tabs={TABS} />

      {renderContent()}
    </Box>
  );
}
