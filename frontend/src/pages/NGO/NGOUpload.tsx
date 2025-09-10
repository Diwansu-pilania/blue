import React from 'react';
import { Container, Typography, TextField, Button, Box, Stack, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const NGOUpload: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload Geo-tagged Plantation Photo
        </Typography>
        
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & Drop your geo-tagged image here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Or click to browse files (JPEG, PNG with GPS data)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Number of Plants"
              type="number"
              required
            />
            <TextField
              fullWidth
              label="Area Covered (sq meters)"
              type="number"
              required
            />
          </Box>
          
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled
          >
            Upload & Process
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default NGOUpload;
