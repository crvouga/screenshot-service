import {
  Box,
  ListItemText,
  MenuItem,
  Select,
  SelectProps,
  Typography,
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { either, option } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useAuthUser } from '../../authentication';
import { useProjectsQuery } from '../../projects';

export const ProjectInput = ({
  projectId,
  setProjectId,
  helperText,
  ...selectProps
}: {
  projectId: option.Option<Data.ProjectId.ProjectId>;
  setProjectId: (projectId: option.Option<Data.ProjectId.ProjectId>) => void;
  helperText?: string;
} & SelectProps) => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });

  const projects =
    query.status !== 'success'
      ? []
      : either.isLeft(query.data)
      ? []
      : query.data.right;

  const currentValue = pipe(
    projectId,
    option.fold(
      () => 'None',
      (projectId) => projectId
    )
  );

  const currentProject = pipe(
    projectId,
    option.fold(
      () => null,
      (projectId) => projects.find((project) => project.projectId === projectId)
    )
  );

  return (
    <Box>
      <Select
        fullWidth
        value={currentValue}
        placeholder="select a project"
        {...selectProps}
      >
        <MenuItem
          value={'None'}
          onClick={() => {
            setProjectId(option.none);
          }}
          disabled
        >
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
              setProjectId(option.some(project.projectId));
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
