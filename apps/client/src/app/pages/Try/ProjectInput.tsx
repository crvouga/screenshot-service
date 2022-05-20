import { IProjectId } from '@crvouga/screenshot-service';
import { ListItemText, MenuItem, Select } from '@mui/material';
import * as React from 'react';
import { useAuthUser } from '../../authentication';
import { useProjectsQuery } from '../../projects';

export const ProjectInput = ({
  projectId,
  setProjectId,
}: {
  projectId: IProjectId | null;
  setProjectId: (projectId: IProjectId | null) => void;
}) => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });
  const options = query.data?.type === 'success' ? query.data.data : [];

  return (
    <Select
      fullWidth
      value={projectId ?? 'NoProject'}
      placeholder="select a project"
    >
      <MenuItem
        value={'NoProject'}
        onClick={() => {
          setProjectId(null);
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
          value={project.projectId}
          onClick={() => {
            setProjectId(project.projectId);
          }}
        >
          <ListItemText primary={project.name} />
        </MenuItem>
      ))}
    </Select>
  );
};
