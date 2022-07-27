import {
  Clear,
  ContentPaste,
  DeleteForever,
  History
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CardActionArea,
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
  TextField,
  TextFieldProps,
  Tooltip,
  Typography
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import * as React from 'react';
import useLocalStorage from '../../../lib/use-local-storage';
import { useCaptureScreenshotRequestQuery } from '../../data-access';

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export const TargetUrlInput = ({
  projectId,
  targetUrl,
  setTargetUrl,
  ...textFieldProps
}: {
  projectId: Data.ProjectId.ProjectId | null,
  targetUrl: string;
  setTargetUrl: (targetUrl: string) => void;
} & TextFieldProps) => {


  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setTargetUrl(text);
  };

  const handleClear = () => {
    setTargetUrl('');
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const onClose = () => {
    setAnchorEl(null)
  }

  const onClick = (url: string) => {
    setTargetUrl(url)
    onClose()
  }

  return (
    <TextField
      fullWidth
      value={targetUrl}
      onChange={(event) => {
        setTargetUrl(event.currentTarget.value);
      }}
      placeholder="https://www.example.com/"
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <Tooltip title="open history">
              <IconButton
                disabled={!projectId}
                onClick={(event) => {
                  setAnchorEl(event.currentTarget);
                }}
              >
                <History />
              </IconButton>
            </Tooltip>

            {projectId && (
              <HistoryMenu
                anchorEl={anchorEl}
                projectId={projectId}
                onClick={onClick}
                onClose={onClose}
              />
            )}

            <Tooltip title="paste">
              <IconButton onClick={handlePaste}>
                <ContentPaste />
              </IconButton>
            </Tooltip>

            <Tooltip title="clear">
              <IconButton onClick={handleClear}>
                <Clear />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
      {...textFieldProps}
    />
  );
};


export const HistoryMenu = ({
  projectId,
  onClick,
  anchorEl,
  onClose
}: {
  anchorEl: HTMLElement | null,
  projectId: Data.ProjectId.ProjectId,
  onClick: (url: string) => void
  onClose: () => void
}) => {
  const [history, setHistory] = useLocalStorage<string[]>(
    'targetUrlHistory',
    []
  );

  const removeFromHistory = (targetUrl: string) => {
    setHistory((history = []) => {
      return history.filter((item) => item !== targetUrl);
    });
  };

  const addToHistory = (targetUrl: string) => {
    setHistory((history = []) => {
      const nextHistory = [targetUrl]
        .concat(history.filter((url) => url !== targetUrl))
        .filter(isValidUrl)
        .slice(0, 20);

      return nextHistory;
    });
  };




  return (
    <Menu
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorEl={anchorEl}
    >
      <Box
        sx={{
          maxWidth: 'sm',
          maxHeight: '360px',
          overflowY: 'scroll',
          overflowX: 'hidden',
        }}
      >

        {history.map((url) => (
          <Box
            key={url}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CardActionArea
              onClick={(_event) => {
                onClick(url);
              }}
              sx={{
                pl: 2,
                py: 1,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Typography
                noWrap
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {url}
              </Typography>
            </CardActionArea>

            <Box sx={{ paddingLeft: 1, paddingRight: 2 }}>
              <Tooltip title="delete forever">
                <IconButton
                  onClick={() => {
                    removeFromHistory(url);
                  }}
                >
                  <DeleteForever />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>

      <Button fullWidth onClick={onClose}>
        close
      </Button>
    </Menu>


  )
}