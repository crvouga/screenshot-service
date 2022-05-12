import { DarkMode, LightMode } from '@mui/icons-material';
import {
  createTheme,
  CssBaseline,
  responsiveFontSizes,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from '@mui/material';
import constate from 'constate';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAppEventListener } from './event-emitter';
import useLocalStorage from './use-local-storage';

/**
 *
 *
 *
 *
 *
 *
 */

export type IThemeMode = 'light' | 'dark';

const toThemeMode = (themeMode: string): IThemeMode => {
  if (themeMode === 'light' || themeMode === 'dark') {
    return themeMode;
  }
  return 'dark';
};

/**
 *
 *
 *
 *
 *
 *
 */

const baseTheme = createTheme();

export const makeTheme = ({ mode }: { mode: IThemeMode }) => {
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

  const [themeMode, setThemeMode] = useState<IThemeMode>(toThemeMode(stored));

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

  const theme = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return darkTheme;

      case 'light':
        return lightTheme;
    }
  }, [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

/**
 *
 *
 *
 *
 *
 *
 *
 *
 */

export const ThemeModeToggleButtonGroup = ({
  themeMode,
  onThemeModeChanged,
  ...props
}: {
  themeMode: IThemeMode;
  onThemeModeChanged: (themeMode: IThemeMode) => void;
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
      <ToggleButton value="dark">
        <DarkMode sx={{ mr: 1 }} />
        Dark
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
