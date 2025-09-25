import { createTheme } from '@mui/material/styles';

// Design system: modern, less generic look
// - Rounded corners
// - Stronger primary
// - Softer background
// - Tighter typography scale
const theme = createTheme({
  direction: 'rtl',
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Heebo", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  palette: {
    primary: {
      main: '#1f6feb', // modern blue
    },
    secondary: {
      main: '#ef476f', // energetic accent
    },
    background: {
      default: '#f6f8fa',
      paper: '#ffffff',
    },
  },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // gradient app bar for less generic look
          background: 'linear-gradient(90deg, #1f6feb 0%, #4b9fff 100%)',
        },
      },
    },
  },
});

export default theme;
