import { ContentCopy, Done } from '@mui/icons-material';
import {
  alpha,
  Box,
  BoxProps,
  SxProps,
  Tooltip,
  TooltipProps,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

type ICopyStatus = 'idle' | 'copied';

export const useCopyToClipboard = () => {
  const [status, setStatus] = useState<ICopyStatus>('idle');

  const snackbar = useSnackbar();

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);

    setStatus('copied');

    snackbar.enqueueSnackbar('copied to clipboard', {
      onClose: () => {
        setStatus('idle');
      },
    });
  };

  return {
    copy,
    status,
  };
};

export const CopyToClipboardTooltip = ({
  status,
  children,
}: { status: ICopyStatus } & Omit<TooltipProps, 'title'>) => {
  return (
    <Tooltip title={status === 'copied' ? 'copied' : 'copy to clipboard'}>
      {children}
    </Tooltip>
  );
};

export const toCopyToClipboardCursorSx = ({
  status,
}: {
  status: ICopyStatus;
}): SxProps => {
  switch (status) {
    case 'copied':
      return {
        cursor: 'default',
      };

    case 'idle':
      return {
        cursor: 'copy',
      };
  }
};

export const CopyToClipboardIcon = ({ status }: { status: ICopyStatus }) => {
  switch (status) {
    case 'copied':
      return <Done />;

    case 'idle':
      return <ContentCopy />;
  }
};

export const CopyToClipboardField = ({ text }: { text: string }) => {
  const copyToClipboard = useCopyToClipboard();
  const theme = useTheme();
  return (
    <CopyToClipboardTooltip {...copyToClipboard}>
      <Box
        sx={{
          ...toCopyToClipboardCursorSx(copyToClipboard),
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          border: `1.5px solid ${theme.palette.grey[400]}`,
          borderRadius: 1,
          paddingX: 2,
          paddingY: 1,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.dark, 0.2),
          },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        onClick={() => {
          copyToClipboard.copy(text);
        }}
      >
        <Typography
          sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {text}
        </Typography>
        <CopyToClipboardIcon {...copyToClipboard} />
      </Box>
    </CopyToClipboardTooltip>
  );
};

/**
 *
 *
 *
 *
 *
 */

// type IPasteStatus = 'idle' | 'pasted';

// export const usePasteClipboard = () => {
//   const [status, setStatus] = useState<IPasteStatus>('idle');

//   const paste = async () => {
//     if (inputRef.current) {
//       const url = await navigator.clipboard.readText();

//       inputRef.current.value = url;

//       onChange(url);
//     }
//   };

//   return {
//     status,
//     paste,
//   };
// };
