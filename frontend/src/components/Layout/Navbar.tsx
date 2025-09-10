import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import NatureIcon from '@mui/icons-material/Nature';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky">
      <Toolbar>
            <NatureIcon sx={{ mr: 1 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Blue Carbon Registry
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/ngo/login"
          >
            NGO Login
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/admin/login"
          >
            Admin Login
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
