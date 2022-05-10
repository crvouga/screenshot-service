import { Box, Container, Typography } from "@mui/material";

export const NotFoundPage = ({ message }: { message: string }) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="h4" align="center">
          {message}
        </Typography>
      </Container>
    </Box>
  );
};
