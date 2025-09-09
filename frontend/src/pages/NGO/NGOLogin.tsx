import React from 'react';
import { Container, Typography, Paper, TextField, Button, Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NGOLogin: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          NGO Login
        </Typography>
        <Box component="form" sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
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
            Login
          </Button>
          <Box textAlign="center">
            <Link component={RouterLink} to="/ngo/register">
              Don't have an account? Register here
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default NGOLogin;
