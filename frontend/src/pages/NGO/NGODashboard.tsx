import React from 'react';
import { Container, Typography, Card, CardContent, Box } from '@mui/material';

const NGODashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>NGO Dashboard</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Uploads</Typography>
            <Typography variant="h4" color="primary">0</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Carbon Credits</Typography>
            <Typography variant="h4" color="primary">0</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Approved Projects</Typography>
            <Typography variant="h4" color="primary">0</Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default NGODashboard;
