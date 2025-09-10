import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Nature as EcoIcon,
  Security as SecurityIcon,
  AccountBalance as AccountBalanceIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <EcoIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Blue Carbon Restoration',
      description: 'Track mangrove, seagrass, and salt marsh restoration projects with AI-powered plant detection.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Blockchain Security',
      description: 'Immutable record-keeping with smart contracts ensuring transparency and verification.',
    },
    {
      icon: <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Carbon Credit Tokenization',
      description: 'Convert verified restoration efforts into tradeable carbon credit tokens.',
    },
    {
      icon: <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Geo-tagged Monitoring',
      description: 'Upload geo-tagged photos for automated verification and monitoring.',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Blue Carbon Registry
        </Typography>
        <Typography variant="h5" component="p" gutterBottom sx={{ color: 'text.secondary', mb: 4 }}>
          Blockchain-Based MRV System for Blue Carbon Ecosystem Restoration
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          A comprehensive platform for NGOs and coastal communities to register, monitor, and verify 
          blue carbon restoration projects. Earn tradeable carbon credits through verified plantation activities.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            to="/ngo/register"
            sx={{ px: 4, py: 1.5 }}
          >
            Register as NGO
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            component={Link} 
            to="/admin/login"
            sx={{ px: 4, py: 1.5 }}
          >
            Admin Access
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4, mb: 6 }}>
        {features.map((feature, index) => (
          <Card key={index} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Problem Statement Section */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Problem Statement #25038
        </Typography>
        <Typography variant="h6" gutterBottom>
          Ministry of Earth Sciences (MoES) - National Centre for Coastal Research (NCCR)
        </Typography>
        <Typography variant="body1">
          Develop a decentralized, verifiable Monitoring, Reporting, and Verification (MRV) system 
          for blue carbon ecosystem restoration with transparent carbon credit generation through blockchain technology.
        </Typography>
      </Paper>

      {/* Statistics Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 3, textAlign: 'center' }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
            0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registered NGOs
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
            0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uploads Processed
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
            0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Carbon Credits Issued
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
            0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hectares Restored
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;
