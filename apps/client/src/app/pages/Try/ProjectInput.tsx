import { Data } from '@crvouga/screenshot-service';
import { ListItemText, MenuItem, Select } from '@mui/material';
import { either, option } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useAuthUser } from '../../authentication';
import { useProjectsQuery } from '../../projects';

export const ProjectInput = ({
  projectId,
  setProjectId,
}: {
  projectId: option.Option<Data.ProjectId.ProjectId>;
  setProjectId: (projectId: option.Option<Data.ProjectId.ProjectId>) => void;
}) => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });
  const options =
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

  return (
    <Select fullWidth value={currentValue} placeholder="select a project">
      <MenuItem
        value={'None'}
        onClick={() => {
          setProjectId(option.none);
        }}
      >
        <ListItemText
          primaryTypographyProps={{ color: 'text.secondary' }}
          primary={'No project selected'}
        />
      </MenuItem>

      {options.map((project) => (
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
  );
};
