import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { ThemeContext, ThemeModeContext } from './app/theme';

const rootElement = document.getElementById('root');

const Root = () => {
  return (
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={new QueryClient()}>
          <ThemeModeContext>
            <ThemeContext>
              <SnackbarProvider
                maxSnack={1}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
              >
                <App />
              </SnackbarProvider>
            </ThemeContext>
          </ThemeModeContext>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
};

if (!rootElement) {
  throw new Error('Root element not found');
}
const reactRoot = ReactDOM.createRoot(rootElement);
reactRoot.render(
  // @ts-ignore
  <Root />
);
