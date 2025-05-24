/* eslint-disable no-unused-vars */
import {
  AddCircle,
} from "@mui/icons-material";
import {
  IconButton,
  List,
  Typography,
  Box,
} from "@mui/material";
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Tabs from '../Tabs/Tabs';

const SERVICES = `services`;
const CATEGORIES = `categories`;

const TABS = {
  [SERVICES]: {
    label: `Services`,
    value: SERVICES,
    url: `create-service`,
    buttonText: `add service`,
  },
  [CATEGORIES]: {
    label: `Categories`,
    value: CATEGORIES,
    url: `create-category`,
    buttonText: `add category`,
  },
};

export default function ServicesContainer({
  services,
  categories,
}) {
  const [activeTab, setActiveTab] = useState(TABS[SERVICES].value);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Tabs
        tabs={[TABS[SERVICES], TABS[CATEGORIES]]}
        onChange={handleTabChange}
      />

      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
          marginTop: `20px`,
          marginLeft: `auto`,
          backgroundColor: `#1976d2`,
          width: `fit-content`,
          padding: `10px 20px 10px 30px`,
          borderRadius: `50px`,
        }}
      >
        <Typography
          variant="button"
          sx={{ color: `#fff` }}
        >
          {TABS[activeTab].buttonText}

        </Typography>

        <RouterLink to={`/services/${TABS[activeTab].url}`}>
          <IconButton
            sx={{color: `#fff`}}
          >
            <AddCircle />
          </IconButton>
        </RouterLink>
      </Box>

      <Box
        sx={{
          display: `flex`,
          flexDirection: `column`,
          gap: `.5rem`,
          marginTop: `2rem`,
          maxWidth: `768px`,
        }}
      >
        {activeTab === TABS[SERVICES].value && services && services.map((service) => (
          <Box
            key={service.id}
            component={RouterLink}
            to={`/services/${service.id}`}
            sx={{
              display: `flex`,
              alignItems: `flex-start`,
              justifyContent: `space-between`,
              width: `100%`,
              gap: `1rem`,
              padding: `.4rem 0 .4rem 0`,
              borderBottom: `1px solid #ddd`,
              textDecoration: `none`,
              color: `#333`,
              position: `relative`,
            }}
          >
            <Box>
              <Typography sx={{
                fontSize: `1.1rem`,
                fontWeight: `bold`,
              }}>
                {service.name}
              </Typography>

              <Typography sx={{
                fontSize: `1rem`,
              }}>
                {service.categoryName}
              </Typography>
            </Box>

          </Box>
        ))}

        {activeTab === TABS[CATEGORIES].value && categories && categories.map((category) => (
          <Box
            key={category.id}
            component={RouterLink}
            to={`/categories/${category.id}`}
            sx={{
              display: `flex`,
              alignItems: `flex-start`,
              justifyContent: `space-between`,
              width: `100%`,
              minHeight: `60px`,
              textDecoration: `none`,
              color: `#333`,
              padding: `.4rem 0 .6rem 0`,
              borderBottom: `1px solid #ddd`,
            }}
          >
            <Typography sx={{
              fontSize: `1.1rem`,
            }}>
              {category.name}
            </Typography>

            <Box
              sx={{
                width: `60px`,
                height: `60px`,
                overflow: `hidden`,
              }}
            >
              <img
                src={category.image}
                style={{ width: `100%` }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}