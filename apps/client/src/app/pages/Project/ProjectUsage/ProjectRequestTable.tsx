import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, Typography
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { CaptureScreenshotRequest } from '@screenshot-service/shared';
import { useEffect, useState } from 'react';
import { dataAccess } from '../../../data-access';

const PAGE_SIZE = 5;

type Order = 'OldestFirst' | 'NewestFirst';

const fetchPage = async ({
  projectId,
  pageIndex,
  order,
}: {
  projectId: Data.ProjectId.ProjectId;
  pageIndex: number;
  order: Order;
}): Promise<CaptureScreenshotRequest[]> => {
  const result = await dataAccess.captureScreenshotRequest.findMany({
    pageSize: PAGE_SIZE,
    page: pageIndex,
    projectId,
    order,
  });

  if (result.type === 'Err') {
    return [];
  }

  return result.value;
};

type Page =
  | { type: 'Loading' }
  | { type: 'Succeeded'; data: CaptureScreenshotRequest[] };

export const ProjectRequestTable = ({ projectId }: { projectId: Data.ProjectId.ProjectId }) => {
  const [order, setOrder] = useState<Order>('NewestFirst');
  const [pageIndex, setPageIndex] = useState(0);
  const [pages, setPages] = useState<{ [pageIndex: number]: Page }>({});

  const onPrev = () => {
    setPageIndex((pageIndex) => Math.max(0, pageIndex - 1));
  };

  const onNext = () => {
    setPageIndex((pageIndex) => Math.max(0, pageIndex + 1));
  };

  useEffect(() => {
    const currentPageIndex = pageIndex;
    if (pages[currentPageIndex] === undefined) {
      setPages((pages) => ({
        ...pages,
        [currentPageIndex]: { type: 'Loading' },
      }));

      fetchPage({
        pageIndex: currentPageIndex,
        order,
        projectId,
      }).then((page) => {
        setPages((pages) => ({
          ...pages,
          [currentPageIndex]: { type: 'Succeeded', data: page },
        }));
      });
    }
  }, [pageIndex, order, pages, projectId]);

  useEffect(() => {
    setPageIndex(0);
    setPages([]);
  }, [order]);

  const page = pages[pageIndex] ?? { type: 'Loading' };

  const canFetchNextPage =
    page.type === 'Succeeded' && page.data.length >= PAGE_SIZE;

  return (

    <Paper sx={{ p: 2, marginBottom: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Requests
        </Typography>
        <Select
          id="order-select"
          labelId="order-select-label"
          value={order}
          size="small"
          onChange={(event) => {
            const orderNew = event.target.value;
            if (orderNew === 'OldestFirst' || orderNew === 'NewestFirst') {
              setOrder(orderNew);
              return;
            }
          }}
        >
          <MenuItem value={'OldestFirst'}>{'Oldest First'}</MenuItem>
          <MenuItem value={'NewestFirst'}>{'Newest First'}</MenuItem>
        </Select>
      </Box>

      <TableContainer
        sx={{ position: 'relative', height: 345, maxHeight: 345 }}
        component={Paper}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Target Url</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Strategy</TableCell>
              <TableCell>Delay (sec)</TableCell>
              <TableCell>Image Type</TableCell>
              <TableCell>Origin Url</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {page.type === 'Loading' && (
              <Box
                component="tr"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress disableShrink />
              </Box>
            )}

            {page.type === 'Succeeded' && (
              <>
                {page.data.length === 0 && (
                  <Box
                    component="tr"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography>No rows</Typography>
                  </Box>
                )}

                {page.data.map((row) => (
                  <TableRow key={row.requestId}>
                    <Cell value={row.requestId} />
                    <Cell value={row.targetUrl} />
                    <Cell value={row.createdAt} />
                    <Cell value={row.status} />
                    <Cell value={row.strategy} />
                    <Cell value={String(row.delaySec)} />
                    <Cell value={row.imageType} />
                    <Cell value={row.originUrl} />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          marginTop: 1,
        }}
      >
        <Button
          disabled={pageIndex === 0}
          size="large"
          startIcon={<ArrowLeft />}
          onClick={onPrev}
        >
          Prev
        </Button>
        <Typography sx={{ marginX: 2 }} variant="h6">
          {pageIndex + 1}
        </Typography>
        <Button
          size="large"
          endIcon={<ArrowRight />}
          onClick={onNext}
          disabled={!canFetchNextPage}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
};

const Cell = ({ value }: { value: string }) => {
  return (
    <TableCell sx={{ maxWidth: 100, width: 100 }}>
      <Typography noWrap>{value}</Typography>
    </TableCell>
  );
};
