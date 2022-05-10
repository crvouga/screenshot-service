import { CssBaseline } from '@mui/material';
import {
  createTheme,
  responsiveFontSizes,
  ThemeProvider,
} from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';

const theme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: 'dark',
    },
    typography: {
      fontFamily: 'monospace',
    },
  })
);

const Root = () => {
  return (
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={new QueryClient()}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
            >
              <App />
            </SnackbarProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root />);
}
