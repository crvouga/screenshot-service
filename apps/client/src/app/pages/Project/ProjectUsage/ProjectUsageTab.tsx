import { LoadingButton } from '@mui/lab';
import { ToggleButton, Button, Box, Alert, CircularProgress, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Select, MenuItem, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { dataAccess } from '../../../data-access';
import { useProfileSingleOutletContext } from '../Project';

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number,
) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];
export const ProjectUsageTab = () => {
  const { project } = useProfileSingleOutletContext();

  const [order, setOrder] = useState<'OldestFirst' | 'NewestFirst'>("NewestFirst")

  const query = useQuery(['project', project.projectId, order], () => dataAccess.captureScreenshotRequest.findMany({ projectId: project.projectId, order }))

  if (query.status === 'idle') {
    return <Loading />
  }

  if (query.status === 'loading') {
    return <Loading />
  }

  if (query.status === 'error') {
    return <Err />
  }



  if (query.data.type === 'Err') {
    return <Err />
  }

  const rows = query.data.value


  const onRefresh = () => {
    query.refetch()

  }

  return <Box>
    <Box sx={{ display: 'flex', padding: 2, paddingY: 4, alignItems: "center", flexDirection: { xs: 'column', sm: 'column', md: 'row' } }}>
      <Typography variant="h5" sx={{ flex: 1 }}>
        Requests
      </Typography>

      <Box sx={{ display: 'flex', alignItems: "center", flexDirection: { xs: 'column', sm: 'column', md: 'row' } }}>
        <ToggleButtonGroup value={order} sx={{ marginRight: 2 }}>
          <ToggleButton value="OldestFirst">
            Oldest First
          </ToggleButton>
          <ToggleButton value="NewestFirst">
            Newest First
          </ToggleButton>
        </ToggleButtonGroup>

        <LoadingButton loading={query.isRefetching} size="large" variant='contained' onClick={onRefresh}>
          Refresh
        </LoadingButton>
      </Box>
    </Box>

    <TableContainer component={Paper}>
      <Table >
        <TableHead sx={{ position: "sticky", }}>
          <TableRow>
            <TableCell>Target Url</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Strategy</TableCell>
            <TableCell>Delay (sec)</TableCell>
            <TableCell>Origin Url</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.requestId}>
              <TableCell
                sx={{
                  maxWidth: "200px",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                <Typography noWrap>
                  {row.targetUrl}
                </Typography>
              </TableCell>
              <TableCell>{new Date(row.createdAt).toISOString()}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.strategy}</TableCell>
              <TableCell>{row.delaySec}</TableCell>
              <TableCell>{row.originUrl}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
};




const Loading = () => {
  return (
    <Container >
      <CircularProgress />
    </Container>
  )
}

const Err = () => {
  return (
    <Container sx={{ width: "100%" }}>
      <Alert severity="error">
        Something went wrong
      </Alert>
    </Container>
  )
}

