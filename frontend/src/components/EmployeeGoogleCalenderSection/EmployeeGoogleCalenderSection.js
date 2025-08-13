import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import React, { useEffect, useState } from 'react';
import axios from '../../services/axios.service.js';
import GoogleCalendarIntegration from '@/components/GoogleCalendarIntegration/GoogleCalendarIntegration';

export default function EmployeeGoogleCalenderSection({ employeeId }) {
  const [googleStatus, setGoogleStatus] = useState({
    loading: true,
    enabled: false,
    tokenExpired: false,
    calendarId: null,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`/google-calendar/${employeeId}/google-calendar-status`);
        if (isMounted) {
          setGoogleStatus({
            loading: false,
            ...response.data,
          });
        }
      } catch (error) {
        if (isMounted) {
          setGoogleStatus((prev) => ({
            ...prev,
            loading: false,
            error: true,
          }));
        }
      }
    };
    if (employeeId) {
      fetchStatus();
    }
    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  return (
    <Accordion
      sx={{
        marginTop: 2,
        borderRadius: 2,
        boxShadow: `0 2px 8px rgba(0,0,0,0.08)`,
        [`&:before`]: { display: `none` },
        overflow: `hidden`,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          px: 2.5,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            display: `flex`,
            alignItems: `center`,
            width: `100%`,
            gap: 1.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: `1.1rem`,
            }}
          >
            Google Calendar
          </Typography>
          <Box
            sx={{
              ml: `auto`,
              display: `flex`,
              alignItems: `center`,
              gap: 1,
            }}
          >
            {googleStatus.loading ? (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Loading...
              </Typography>
            ) : googleStatus.enabled ? (
              <Chip
                label="Active"
                color="success"
                size="small"
              />
            ) : googleStatus.tokenExpired ? (
              <Chip
                label="Expired"
                color="warning"
                size="small"
              />
            ) : (
              <Chip
                label="Not connected"
                size="small"
              />
            )}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          px: 2.5,
          pt: 0,
          pb: 2.5,
        }}
      >
        <GoogleCalendarIntegration employeeId={employeeId} />
      </AccordionDetails>
    </Accordion>
  );
}


