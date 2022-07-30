import { Box, CircularProgress, MenuItem, Paper, Select, Toolbar, Typography } from '@mui/material';
import { Data } from "@screenshot-service/screenshot-service";
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import DataTable from "react-data-table-component";
import { dataAccess } from '../../../data-access';


type Order = 'OldestFirst' | 'NewestFirst'

const fallbackTotalRows = 10

export const ProjectRequestTable = ({ projectId }: { projectId: Data.ProjectId.ProjectId }) => {
  const [order, setOrder] = useState<Order>("NewestFirst")
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)

  const totalRowsQuery = useQuery(['requests', projectId, "total-rows"], async () => {
    const result = await dataAccess.captureScreenshotRequest.countAll({ projectId })

    if (result.type === 'Err') {
      return fallbackTotalRows
    }

    return result.value
  })

  const totalRows = totalRowsQuery.data ?? fallbackTotalRows

  const query = useQuery(['requests', projectId, order, page, pageSize], async () => {
    const result = await dataAccess.captureScreenshotRequest.findMany({
      pageSize,
      page,
      projectId,
      order
    })

    if (result.type === 'Err') {
      return []
    }

    return result.value
  }, {
    keepPreviousData: true
  })

  const rows = query?.data ?? []


  return <Paper sx={{ marginBottom: 4, overflow: "hidden" }}>
    <Toolbar >
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

    <DataTable

      columns={[
        {
          name: "id",
          selector: row => row.requestId,
        },
        {
          name: "created at",
          selector: row => row.createdAt,
        },
        {
          name: "target url",
          selector: row => row.targetUrl,
        },
        {
          name: "origin url",
          selector: row => row.originUrl,
        },
        {
          name: "status",
          selector: row => row.status,
        },
        {
          name: "strategy",
          selector: row => row.strategy,
        },
        {
          name: "image type",
          selector: row => row.imageType,
        },
      ]}
      data={rows}
      progressPending={query.isLoading}
      progressComponent={<Box sx={{ width: "100%", height: 480, display: 'flex', alignItems: 'center', justifyContent: "center" }}><CircularProgress /></Box>}
      pagination
      paginationServer
      paginationTotalRows={totalRows}
      onChangePage={(page) => {
        setPage(page - 1)
      }}
      onChangeRowsPerPage={(newPerPage, page) => {
        setPageSize(newPerPage)
        setPage(page - 1)
      }}
    />
  </Paper >
};



