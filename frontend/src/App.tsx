import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Import components
import Navbar from './components/Layout/Navbar';
import HomePage from './pages/HomePage';
import NGOLogin from './pages/NGO/NGOLogin';
import NGORegister from './pages/NGO/NGORegister';
import NGODashboard from './pages/NGO/NGODashboard';
import NGOUpload from './pages/NGO/NGOUpload';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminNGOs from './pages/Admin/AdminNGOs';
import AdminUploads from './pages/Admin/AdminUploads';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green for environmental theme
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#0277BD', // Blue for ocean theme
      light: '#03A9F4',
      dark: '#01579B',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E7D32',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              
              {/* NGO Routes */}
              <Route path="/ngo/login" element={<NGOLogin />} />
              <Route path="/ngo/register" element={<NGORegister />} />
              <Route path="/ngo/dashboard" element={<NGODashboard />} />
              <Route path="/ngo/upload" element={<NGOUpload />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/ngos" element={<AdminNGOs />} />
              <Route path="/admin/uploads" element={<AdminUploads />} />
              
              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
