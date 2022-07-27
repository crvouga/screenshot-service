import { useProfileSingleOutletContext } from '../Project';

export const ProjectScreenshotsTab = () => {
  const { project } = useProfileSingleOutletContext();

  return <>{JSON.stringify(project, null, 4)}</>
};

