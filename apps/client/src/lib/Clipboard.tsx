import { ContentCopy, Done } from '@mui/icons-material';
import { SxProps, Tooltip, TooltipProps } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

type IStatus = 'idle' | 'copied';

export const useCopyToClipboard = () => {
  const [status, setStatus] = useState<IStatus>('idle');

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
}: { status: IStatus } & Omit<TooltipProps, 'title'>) => {
  return (
    <Tooltip title={status === 'copied' ? 'copied' : 'copy to clipboard'}>
      {children}
    </Tooltip>
  );
};

export const toCopyToClipboardCursorSx = ({
  status,
}: {
  status: IStatus;
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

export const CopyToClipboardIcon = ({ status }: { status: IStatus }) => {
  switch (status) {
    case 'copied':
      return <Done />;

    case 'idle':
      return <ContentCopy />;
  }
};
