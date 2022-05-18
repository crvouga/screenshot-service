import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { useScreenshotsQuery } from '../../screenshots';

export const TargetUrlInput = ({
  projectId,
  onChange,
}: {
  projectId: string;
  onChange: (targetUrl: string | null) => void;
}) => {
  const query = useScreenshotsQuery({ projectId });
  const options: string[] =
    query.data?.type === 'success'
      ? query.data.screenshots.map((_) => _.targetUrl)
      : [];

  return (
    <Autocomplete
      id="targetUrl"
      fullWidth
      freeSolo
      options={options}
      loading={query.isLoading}
      onChange={(_event, option) => onChange(option)}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="https://www.example.com/"
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
