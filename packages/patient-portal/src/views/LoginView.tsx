import React, { useState } from 'react';
import { Box, Typography, Container, Paper, TextField, Button } from '@mui/material';
import { AccordionSection } from '@tamanu/ui-components';
import { useAuth } from '@auth/useAuth';
import { User } from 'lucide-react';

export const LoginView = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');

  const handleLogin = async (email: string) => {
    await login(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      handleLogin(email);
    }
  };

  return (
    <Container maxWidth="md">
      <AccordionSection header="Patient Details" icon={<User />}>
        test
      </AccordionSection>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Login
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
