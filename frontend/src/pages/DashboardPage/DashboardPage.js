import Grid from "@mui/material/Grid";
import PageContainer from '@/components/PageContainer/PageContainer';
import QrStatsWidget from '@/components/QrStatsWidget/QrStatsWidget';


export default function DashboardPage() {
  return (
    <PageContainer
      pageTitle="Dashboard"
    >
      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          xs={12}
          md={6}
        >
          <QrStatsWidget />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
