import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { api, AdminLoginData } from '../../services/api';

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState<AdminLoginData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof AdminLoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.loginAdmin(formData);
      setMessage({
        type: 'success',
        text: `Welcome back, ${response.data.admin.name}!`
      });
      // In a real app, you would redirect to admin dashboard
      console.log('Admin logged in:', response.data);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Login failed. Please check your credentials.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center" color="primary">
          Admin Login
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>
          NCCR - Ministry of Earth Sciences
        </Typography>
        
        {/* Demo Credentials Info */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Demo Credentials:</strong><br />
          Email: admin@bluecarbon.gov.in<br />
          Password: admin123
        </Alert>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Admin Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login as Admin'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLogin;
