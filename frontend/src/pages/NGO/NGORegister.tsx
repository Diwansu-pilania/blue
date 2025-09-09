import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const NGORegister: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          NGO Registration
        </Typography>
        <Typography>Registration form coming soon...</Typography>
      </Paper>
    </Container>
  );
};

export default NGORegister;
