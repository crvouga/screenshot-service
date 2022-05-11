import { Link as MuiLink, LinkProps } from '@mui/material';
import {
  Link as RouterLink,
  useLocation as useRouterLocation,
  useNavigate as useRouterNavigate,
} from 'react-router-dom';
import { matchPath } from 'react-router-dom';

export const routes = {
  '/': {
    pattern: '/',
    make: () => `/`,
  },
  '/screenshot': {
    pattern: '/screenshot',
    make: () => `/screenshot`,
  },
  '/logout': {
    pattern: '/logout',
    make: () => `/logout`,
  },
  '/projects': {
    pattern: '/projects',
    make: () => `/projects`,
  },
  '/projects/create': {
    pattern: '/projects/create',
    make: () => `/projects/create`,
  },
  '/projects/:id': {
    pattern: '/projects/:id',
    make: (id: string) => `/projects/${id}`,
  },
  '/projects/:id/screenshots': {
    pattern: '/projects/:id/screenshots',
    make: (id: string) => `/projects/${id}/screenshots`,
  },
  '/try': {
    pattern: '/try',
    make: () => `/try`,
  },
  '/account': {
    pattern: '/account',
    make: () => `/account`,
  },
};

export const isMatch = (
  pathname: string,
  route: { pattern: string }
): boolean => {
  return Boolean(matchPath(route.pattern, pathname));
};

type ILocationState = 'closed' | 'try-drawer-opened';

type ILocation = {
  pathname: string;
  state: ILocationState;
};

const toLocationState = (state: unknown): ILocationState => {
  if (
    typeof state === 'string' &&
    (state === 'closed' || state === 'try-drawer-opened')
  ) {
    return state;
  }

  return 'closed';
};

export const useLocation = (): ILocation => {
  const location = useRouterLocation();
  return {
    pathname: location.pathname,
    state: toLocationState(location.state),
  };
};

export const useNavigate = () => {
  const navigate = useRouterNavigate();

  return ({ state, to }: { state?: ILocationState; to: string }) => {
    navigate(to, state ? { state } : {});
  };
};

export const Link = ({
  to,
  state,

  ...linkProps
}: { state?: ILocationState; to: string } & LinkProps) => {
  return (
    <RouterLink to={to} state={state}>
      <MuiLink {...linkProps} />
    </RouterLink>
  );
};
