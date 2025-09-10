import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { api, NGORegistrationData } from '../../services/api';

const NGORegister: React.FC = () => {
  const [formData, setFormData] = useState<NGORegistrationData>({
    organizationName: '',
    registrationNumber: '',
    email: '',
    password: '',
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    yearEstablished: new Date().getFullYear(),
    focusAreas: [],
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof NGORegistrationData];
        return {
          ...prev,
          [parent]: {
            ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
            [child]: value
          }
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.registerNGO(formData);
      setMessage({
        type: 'success',
        text: response.message || 'NGO registered successfully! Awaiting admin approval.'
      });
      // Reset form on success
      setFormData({
        organizationName: '',
        registrationNumber: '',
        email: '',
        password: '',
        contactPerson: { name: '', phone: '', email: '' },
        address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
        yearEstablished: new Date().getFullYear(),
        focusAreas: [],
        description: ''
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          NGO Registration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Register your organization for the Blue Carbon Registry Program
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Organization Details */}
            <Typography variant="h6" color="primary">
              Organization Details
            </Typography>
            
            <TextField
              fullWidth
              label="Organization Name"
              value={formData.organizationName}
              onChange={(e) => handleInputChange('organizationName', e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              label="Registration Number"
              value={formData.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              required
              helperText="Official NGO registration number"
            />
            
            <TextField
              fullWidth
              label="Organization Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              helperText="Minimum 6 characters"
            />

            {/* Contact Person */}
            <Typography variant="h6" color="primary">
              Contact Person
            </Typography>
            
            <TextField
              fullWidth
              label="Contact Person Name"
              value={formData.contactPerson.name}
              onChange={(e) => handleInputChange('contactPerson.name', e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.contactPerson.phone}
              onChange={(e) => handleInputChange('contactPerson.phone', e.target.value)}
              required
              helperText="Primary contact number"
            />

            {/* Address */}
            <Typography variant="h6" color="primary">
              Address
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                label="City"
                value={formData.address?.city || ''}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
              />
              <TextField
                label="State"
                value={formData.address?.state || ''}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              helperText="Brief description of your organization's work"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Register NGO'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default NGORegister;
