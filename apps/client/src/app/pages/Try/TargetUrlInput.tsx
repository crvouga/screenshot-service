import {
  Clear,
  ContentPaste,
  DeleteForever,
  History,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CardActionArea,
  IconButton,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import * as React from 'react';
import useLocalStorage from '../../../lib/use-local-storage';

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export const TargetUrlInput = ({
  targetUrl,
  setTargetUrl,
}: {
  targetUrl: string;
  setTargetUrl: (targetUrl: string) => void;
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

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setTargetUrl(text);
    addToHistory(text);
  };

  const handleClear = () => {
    setTargetUrl('');
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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
          <Box sx={{ display: 'flex', flex: 1, mr: -1 }}>
            <Tooltip title="open history">
              <IconButton
                onClick={(event) => {
                  setAnchorEl(event.currentTarget);
                }}
              >
                <History />
              </IconButton>
            </Tooltip>
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
              onClose={() => setAnchorEl(null)}
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
                {history.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CardActionArea
                      onClick={(_event) => {
                        setTargetUrl(item);
                        setAnchorEl(null);
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
                        {item}
                      </Typography>
                    </CardActionArea>

                    <Box sx={{ paddingLeft: 1, paddingRight: 2 }}>
                      <Tooltip title="delete forever">
                        <IconButton
                          onClick={(event) => {
                            removeFromHistory(item);
                          }}
                        >
                          <DeleteForever />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Button fullWidth onClick={() => setAnchorEl(null)}>
                close
              </Button>
            </Menu>
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
          </Box>
        ),
      }}
    />
  );
};
