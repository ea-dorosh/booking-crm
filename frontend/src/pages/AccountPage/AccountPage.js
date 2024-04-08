import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PageContainer from '@/components/PageContainer/PageContainer';


export default function AccountPage() {
  const logout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <PageContainer pageTitle="Account">
      <Typography variant="body1"  sx={{ marginTop: `20px` }}>
          Hey, here you can log out
      </Typography>

      <Button
        sx={{ marginTop: `20px` }}
        variant="contained" 
        color="primary"
        onClick={logout}>Log out
      </Button>
    </PageContainer>
  );
}
