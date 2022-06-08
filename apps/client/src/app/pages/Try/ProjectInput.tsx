import {
  Box,
  ListItemText,
  MenuItem,
  Select,
  SelectProps,
  Typography,
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import React from 'react';
import { useAuthUser } from '../../authentication';
import { useProjectsQuery } from '../../projects';

export const ProjectInput = ({
  projectId,
  setProjectId,
  helperText,
  ...selectProps
}: {
  projectId: Data.ProjectId.ProjectId | null;
  setProjectId: (projectId: Data.ProjectId.ProjectId) => void;
  helperText?: string;
} & SelectProps) => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });

  const projects =
    query.status !== 'success'
      ? []
      : Data.Result.isErr(query.data)
      ? []
      : query.data.value;

  const currentValue = projectId ?? 'None';

  const currentProject =
    projects.find((project) => project.projectId === projectId) ?? 'None';

  return (
    <Box>
      <Select
        fullWidth
        value={currentValue}
        placeholder="select a project"
        {...selectProps}
      >
        <MenuItem value={'None'} disabled>
          <ListItemText
            primaryTypographyProps={{ color: 'text.secondary' }}
            primary={'Select a project...'}
          />
        </MenuItem>

        {projects.map((project) => (
          <MenuItem
            value={project.projectId}
            key={project.projectId}
            onClick={() => {
              setProjectId(project.projectId);
            }}
          >
            <ListItemText primary={project.projectName} />
          </MenuItem>
        ))}
      </Select>

      {helperText && (
        <Typography
          color={selectProps.error ? 'error' : 'inherit'}
          variant="caption"
          sx={{ marginX: 1.5 }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};
