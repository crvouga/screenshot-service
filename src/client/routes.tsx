import { Link as MuiLink, LinkProps } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { matchPath } from "react-router-dom";

export const routes = {
  "/": {
    pattern: "/",
    make: () => `/`,
  },
  "/screenshot": {
    pattern: "/screenshot",
    make: () => `/screenshot`,
  },
  "/logout": {
    pattern: "/logout",
    make: () => `/logout`,
  },
  "/projects": {
    pattern: "/projects",
    make: () => `/projects`,
  },
  "/projects/create": {
    pattern: "/projects/create",
    make: () => `/projects/create`,
  },
  "/projects/:id": {
    pattern: "/projects/:id",
    make: (id: string) => `/projects/${id}`,
  },
  "/projects/:id/try": {
    pattern: "/projects/:id/try",
    make: (id: string) => `/projects/${id}/try`,
  },
};

export const isMatch = (
  pathname: string,
  route: { pattern: string }
): boolean => {
  return Boolean(matchPath(route.pattern, pathname));
};

export const Link = ({ to, ...linkProps }: { to: string } & LinkProps) => {
  return (
    <RouterLink to={to}>
      <MuiLink {...linkProps} />
    </RouterLink>
  );
};
