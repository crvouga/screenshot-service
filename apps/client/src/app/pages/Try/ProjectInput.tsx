import { Data } from '@crvouga/screenshot-service';
import { ListItemText, MenuItem, Select } from '@mui/material';
import { either, option } from 'fp-ts';
import * as React from 'react';
import { useAuthUser } from '../../authentication';
import { useProjectsQuery } from '../../projects';

const Eq = option.getEq(Data.ProjectId.Eq);

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

  return (
    <Select fullWidth placeholder="select a project">
      <MenuItem
        selected={Eq.equals(projectId, option.none)}
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
          key={project.projectId}
          selected={Eq.equals(projectId, option.some(project.projectId))}
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
