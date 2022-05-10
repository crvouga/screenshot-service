import { Avatar, Box, Breadcrumbs, Toolbar, Typography } from "@mui/material";
import { ReactNode } from "react";
import { Link, routes } from "./routes";

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
          <Link to={routes["/"].make()}>
            <Typography variant="h4">📸</Typography>
          </Link>
          {breadcrumbs}
        </Breadcrumbs>
      </Box>
      <Box sx={{ flex: 1 }}></Box>
      <Avatar />
    </Toolbar>
  );
};
