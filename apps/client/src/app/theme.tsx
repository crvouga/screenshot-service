import { DarkMode, LightMode, SettingsBrightness } from '@mui/icons-material';
import {
  createTheme,
  CssBaseline,
  responsiveFontSizes,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
  useMediaQuery,
} from '@mui/material';
import constate from 'constate';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAppEventListener } from './app-event-emitter';
import useLocalStorage from '../lib/use-local-storage';

//
//
//
//
//
//
//
//

export type ThemeMode = 'light' | 'dark' | 'system';

const toThemeMode = (themeMode: string): ThemeMode => {
  if (themeMode === 'light' || themeMode === 'dark' || themeMode === 'system') {
    return themeMode;
  }

  return 'dark';
};

//
//
//
//
//
//
//
//

const baseTheme = createTheme();

export const makeTheme = ({ mode }: { mode: 'light' | 'dark' }) => {
  return responsiveFontSizes(
    createTheme({
      palette: {
        mode,
      },
      typography: {
        fontFamily: "'Nunito', sans-serif",
      },
      components: {
        MuiPaper: {
          defaultProps: {
            variant: 'outlined',
          },
        },

        MuiAvatar: {
          styleOverrides: {
            root: {
              border: `1px solid ${baseTheme.palette.divider}`,
            },
          },
        },
        MuiFab: {
          styleOverrides: {
            root: {
              textTransform: 'lowercase',
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'lowercase',
            },
          },
        },
        MuiToggleButton: {
          styleOverrides: {
            root: {
              textTransform: 'lowercase',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'lowercase',
              borderRadius: 24,
            },
          },
        },
      },
    })
  );
};

const darkTheme = makeTheme({ mode: 'dark' });
const lightTheme = makeTheme({ mode: 'light' });

export const [ThemeModeContext, useThemeModeContext] = constate(() => {
  const [stored, setStored] = useLocalStorage('theme-mode', 'dark');

  const [themeMode, setThemeMode] = useState<ThemeMode>(toThemeMode(stored));

  useEffect(() => {
    setStored(themeMode);
  }, [setStored, themeMode]);

  useAppEventListener('Profile', ({ profile }) => {
    setThemeMode(profile.themeMode);
  });

  return {
    themeMode,
    setThemeMode,
  };
});

export const ThemeContext = ({ children }: { children: ReactNode }) => {
  const { themeMode } = useThemeModeContext();

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return darkTheme;

      case 'light':
        return lightTheme;

      case 'system':
        if (prefersDarkMode) {
          return darkTheme;
        }

        return lightTheme;
    }
  }, [themeMode, prefersDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
};

//
//
//
//
//
//
//
//

export const ThemeModeToggleButtonGroup = ({
  themeMode,
  onThemeModeChanged,
  ...props
}: {
  themeMode: ThemeMode;
  onThemeModeChanged: (themeMode: ThemeMode) => void;
} & ToggleButtonGroupProps) => {
  return (
    <ToggleButtonGroup
      color="primary"
      value={themeMode}
      exclusive
      onChange={(_, value) => {
        onThemeModeChanged(toThemeMode(value));
      }}
      {...props}
    >
      <ToggleButton value="light">
        <LightMode sx={{ mr: 1 }} />
        Light
      </ToggleButton>

      <ToggleButton value="system">
        <SettingsBrightness sx={{ mr: 1 }} />
        System
      </ToggleButton>

      <ToggleButton value="dark">
        <DarkMode sx={{ mr: 1 }} />
        Dark
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
