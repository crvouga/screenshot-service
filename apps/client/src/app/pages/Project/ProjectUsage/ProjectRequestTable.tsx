import { Refresh } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, MenuItem, Paper, Select, Toolbar, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Data } from "@screenshot-service/screenshot-service";
import { CaptureScreenshotRequest } from '@screenshot-service/shared';
import { useEffect, useState } from 'react';
import { dataAccess } from '../../../data-access';

const columns: GridColDef[] = [
  { field: "requestId", headerName: "ID" },
  { field: "targetUrl", headerName: "Target Url", },
  { field: "createdAt", headerName: "Created At", },
  { field: "status", headerName: "Status", },
  { field: "strategy", headerName: "Strategy" },
  { field: "delaySec", headerName: "Delay (sec)" },
  { field: "imageType", headerName: "Image Type" },
  { field: "originUrl", headerName: "Origin Url", },
];

const PAGE_SIZE = 5

type Order = 'OldestFirst' | 'NewestFirst'

const fetchPage = async ({ projectId, pageIndex, order }: { projectId: Data.ProjectId.ProjectId, pageIndex: number, order: Order }): Promise<CaptureScreenshotRequest[]> => {
  const result = await dataAccess.captureScreenshotRequest.findMany({
    // todo fix removing +1 will prevent table from fetching next page
    pageSize: PAGE_SIZE + 1,
    page: pageIndex,
    projectId,
    order
  })

  if (result.type === 'Err') {
    return []
  }

  return result.value
}

export const ProjectRequestTable = ({ projectId }: { projectId: Data.ProjectId.ProjectId }) => {
  const [order, setOrder] = useState<Order>("NewestFirst")
  const [pageIndex, setPageIndex] = useState(0)
  const [pages, setPages] = useState<CaptureScreenshotRequest[][]>([])
  const [status, setStatus] = useState<"idle" | "loading">("idle")

  useEffect(() => {
    if (pageIndex > pages.length - 1) {
      setStatus("loading")
      fetchPage({ pageIndex, order, projectId }).then(page => {
        setStatus("idle")
        setPages(pages => ([...pages, page]))
      })
    }
  }, [pageIndex, order, pages.length, projectId])

  const onRestart = () => {
    setPageIndex(0)
    setPages([])
  }

  useEffect(() => {
    onRestart()
  }, [order])

  const rows = Object.values(pages
    .flatMap(page => page)
    .reduce<{ [requestId: string]: CaptureScreenshotRequest }>(
      (uniq, request) => ({
        ...uniq,
        [request.requestId]: request
      }),
      {}
    ))

  return <Paper sx={{ p: 2, marginBottom: 4 }}>
    <Toolbar disableGutters>
      <Typography variant="h6" sx={{ flex: 1 }}>
        api requests
      </Typography>
      <Select
        id="order-select"
        labelId="order-select-label"
        value={order}
        size="small"
        onChange={event => {
          const orderNew = event.target.value
          if (orderNew === 'OldestFirst' || orderNew === 'NewestFirst') {
            setOrder(orderNew)
            return
          }
        }}
      >
        <MenuItem value={"OldestFirst"}>{"oldest first"}</MenuItem>
        <MenuItem value={"NewestFirst"}>{"newest first"}</MenuItem>
      </Select>
    </Toolbar>

    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        page={pageIndex}
        pageSize={PAGE_SIZE}
        rowsPerPageOptions={[PAGE_SIZE]}
        pagination
        onPageChange={setPageIndex}
        getRowId={row => row.requestId}
        disableSelectionOnClick
        loading={status === 'loading'}
      />
    </Box>
    <Box sx={{ paddingY: 2, display: "flex", flexDirection: "row-reverse" }}>
      <LoadingButton loading={status === "loading"} onClick={onRestart} startIcon={<Refresh />} variant="contained">
        Restart
      </LoadingButton>
    </Box>
  </Paper >
};