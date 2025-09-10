import React from 'react';
import { Container, Typography, Card, CardContent, Button, Box, Stack } from '@mui/material';
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
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="h4" color={`${stat.color}.main`}>
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Stack direction="row" spacing={2}>
        <Button 
          variant="contained" 
          component={Link} 
          to="/admin/ngos"
        >
          Manage NGOs
        </Button>
        <Button 
          variant="contained" 
          component={Link} 
          to="/admin/uploads"
        >
          Review Uploads
        </Button>
      </Stack>
    </Container>
  );
};

export default AdminDashboard;
