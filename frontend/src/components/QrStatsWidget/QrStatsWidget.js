import {
  QrCode2 as QrIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQrScanStats } from '@/features/tracking/trackingSlice';

export default function QrStatsWidget() {
  const dispatch = useDispatch();
  const {
    stats, loading, error, 
  } = useSelector((state) => state.tracking);

  useEffect(() => {
    dispatch(fetchQrScanStats(90)); // Last 3 months
  }, [dispatch]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert
            severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          mb={2}>
          <QrIcon
            color="primary"
            sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="h2">
            QR Code Statistics
          </Typography>
        </Box>

        <Grid
          container
          spacing={3}>
          <Grid
            item
            xs={6}>
            <Box
              textAlign="center">
              <Typography
                variant="h4"
                color="primary"
                fontWeight="bold">
                {stats.totalScans}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Total Scans
              </Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={6}>
            <Box
              textAlign="center">
              <Typography
                variant="h4"
                color="secondary"
                fontWeight="bold">
                {stats.uniqueScans}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Unique Visitors
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {stats.scansByDay && stats.scansByDay.length > 0 && (
          <Box
            mt={3}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom>
              Recent Activity (Last 7 days)
            </Typography>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center">
              {stats.scansByDay.slice(-7).map((day) => (
                <Box
                  key={day.date}
                  textAlign="center"
                  flex={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary">
                    {new Date(day.date).toLocaleDateString(`en-US`, {
                      month: `short`,
                      day: `numeric`,
                    })}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold">
                    {day.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}