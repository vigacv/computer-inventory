import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Computer Inventory
          </Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="xl" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  )
}
