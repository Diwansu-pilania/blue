import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const AdminNGOs: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          NGO Management
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Review and approve NGO registration applications.
        </Typography>
        
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No pending NGO applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Applications will appear here when NGOs register
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminNGOs;
