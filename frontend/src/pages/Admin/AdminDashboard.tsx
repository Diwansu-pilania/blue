import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Pending NGO Applications', value: '0', color: 'warning' },
    { label: 'Total Registered NGOs', value: '0', color: 'primary' },
    { label: 'Pending Upload Reviews', value: '0', color: 'error' },
    { label: 'Carbon Credits Issued', value: '0', color: 'success' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h4" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item>
          <Button 
            variant="contained" 
            component={Link} 
            to="/admin/ngos"
          >
            Manage NGOs
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            component={Link} 
            to="/admin/uploads"
          >
            Review Uploads
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
