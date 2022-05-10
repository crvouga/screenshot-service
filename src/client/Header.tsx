import { Avatar, Box, Breadcrumbs, Toolbar, Typography } from "@mui/material";
import { ReactNode } from "react";

export const Header = ({ breadcrumbs }: { breadcrumbs: ReactNode[] }) => {
  return (
    <Toolbar>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Breadcrumbs>
          <Typography variant="h4">📸</Typography>
          {breadcrumbs}
        </Breadcrumbs>
      </Box>
      <Box sx={{ flex: 1 }}></Box>
      <Avatar />
    </Toolbar>
  );
};
