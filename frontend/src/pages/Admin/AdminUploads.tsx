import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const AdminUploads: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload Reviews
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Review geo-tagged uploads from NGOs and approve carbon credits.
        </Typography>
        
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No pending upload reviews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uploads from approved NGOs will appear here for review
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminUploads;
