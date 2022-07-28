import { LoadingButton } from '@mui/lab';
import { Alert, Box, CircularProgress, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { dataAccess } from '../../../data-access';
import { useProfileSingleOutletContext } from '../Project';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: "id", headerName: "ID" },
  { field: "targetUrl", headerName: "Target Url", },
  { field: "createdAt", headerName: "Created At", },
  { field: "status", headerName: "Status", },
  { field: "strategy", headerName: "Strategy" },
  { field: "delaySec", headerName: "Delay (sec)" },
  { field: "imageType", headerName: "Image Type" },
  { field: "originUrl", headerName: "Origin Url" },
];

const PAGE_SIZE = 5

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

  const rows = query.data.value.map(row => ({ ...row, id: row.requestId }))


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

    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={PAGE_SIZE}
        rowsPerPageOptions={[5]}
      />
    </Box>

  </Box >
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

