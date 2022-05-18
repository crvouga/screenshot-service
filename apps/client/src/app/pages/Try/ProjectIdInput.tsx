import { ListItem, ListItemText } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { useAuthUser } from '../../authentication';
import { IProject, useProjectsQuery } from '../../projects';

export const ProjectIdInput = ({
  onChange,
}: {
  onChange: (project: IProject | null) => void;
}) => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });
  const options = query.data?.type === 'success' ? query.data.data : [];

  return (
    <Autocomplete
      id="project-id"
      fullWidth
      options={options}
      loading={query.isLoading}
      onChange={(_event, option) => onChange(option)}
      renderOption={(props, option) => (
        <ListItem {...props}>
          <ListItemText
            primary={option.name}
            secondaryTypographyProps={{ variant: 'subtitle2' }}
            secondary={option.projectId}
          />
        </ListItem>
      )}
      getOptionLabel={(option) => option.name}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="some project"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {query.isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};
