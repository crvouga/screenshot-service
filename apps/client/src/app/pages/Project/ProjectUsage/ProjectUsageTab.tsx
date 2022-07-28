import { LoadingButton } from '@mui/lab';
import { Alert, Box, CircularProgress, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { dataAccess } from '../../../data-access';
import { useProfileSingleOutletContext } from '../Project';


export const ProjectUsageTab = () => {
  const { project } = useProfileSingleOutletContext();

  const [order, setOrder] = useState<'OldestFirst' | 'NewestFirst'>("NewestFirst")

  const query = useQuery(['project', project.projectId, order], () => dataAccess.captureScreenshotRequest.findMany({ projectId: project.projectId, order }))


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
    <Toolbar>
      <Typography variant="h6">
        Requests
      </Typography>

      <Box sx={{ flex: 1 }} />

      <ToggleButtonGroup size="small" value={order} sx={{ marginRight: 2 }}>
        <ToggleButton value="OldestFirst">
          Oldest First
        </ToggleButton>
        <ToggleButton value="NewestFirst">
          Newest First
        </ToggleButton>
      </ToggleButtonGroup>

      <LoadingButton loading={query.isRefetching} size="small" variant='contained' onClick={onRefresh}>
        Refresh
      </LoadingButton>
    </Toolbar>

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

