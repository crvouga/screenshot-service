import { SnackbarProvider } from 'notistack';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { ThemeContext, ThemeModeContext } from './app/theme';
import { ReactQueryDevtools } from 'react-query/devtools';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
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
                <ReactQueryDevtools />
              </SnackbarProvider>
            </ThemeContext>
          </ThemeModeContext>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
