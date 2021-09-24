import { CssBaseline } from "@mui/material";
import {
  createTheme,
  responsiveFontSizes,
  ThemeProvider,
} from "@mui/material/styles";
import React from "react";

const theme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: "dark",
    },
    typography: {
      fontFamily: "monospace",
    },
  })
);

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
