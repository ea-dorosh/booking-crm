import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import servicesService from '@/services/services.service';

export default async function ServicesPage() {
  const data = await servicesService.getServices();

	return (
		<Container>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<Typography variant="body1" gutterBottom>
          Services Page
				</Typography>
			</Box>

      <ul>
        {data.map(service => 
          <li key={service.id}>
            service name:{service.name}
            service id:{service.id}

            <Link href="/services/booking">
              <Button variant="contained">Book an appointment</Button>
            </Link>
          </li>
        )}
      </ul>
		</Container>
	);
}
