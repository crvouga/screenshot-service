import { Box, CircularProgress, Typography } from "@mui/material";

export const BrandedLoadingPage = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Typography variant="h1">📸</Typography>
    </Box>
  );
};

export const LoadingPage = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
};
