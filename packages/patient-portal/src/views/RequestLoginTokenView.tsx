import React from 'react';
import { Box, Typography, Container, Paper, TextField } from '@mui/material';
import { useNavigate } from 'react-router';
import { Button } from '@tamanu/ui-components';
import { useRequestLoginToken } from '@api/mutations';

export const RequestLoginTokenView = () => {
  const navigate = useNavigate();

  const { mutate: submit } = useRequestLoginToken({
    onSuccess: () => {
      navigate('/login-submit');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;

    if (email && email.trim()) {
      submit(email);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Log In
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="email"
              name="email"
              label="Email Address"
              required
              autoComplete="email"
              autoFocus
            />
            <Button type="submit" fullWidth variant="contained">
              Login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};
