import React from 'react';
import { Container, Typography, Paper, Grid, Card, CardContent } from '@mui/material';

const NGODashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>NGO Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Uploads</Typography>
              <Typography variant="h4" color="primary">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Carbon Credits</Typography>
              <Typography variant="h4" color="primary">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Approved Projects</Typography>
              <Typography variant="h4" color="primary">0</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NGODashboard;
