import React from 'react';
import { Container, Typography, Paper, TextField, Button, Box } from '@mui/material';

const AdminLogin: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Admin Login
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>
          NCCR - Ministry of Earth Sciences
        </Typography>
        <Box component="form" sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Employee ID"
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Login as Admin
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLogin;
