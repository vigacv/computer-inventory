import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="h1">
            Computer Inventory
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography color="text.secondary">Coming soon.</Typography>
      </Container>
    </Box>
  )
}
