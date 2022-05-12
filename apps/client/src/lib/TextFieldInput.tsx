import ClearIcon from '@mui/icons-material/Clear';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
  Tooltip,
} from '@mui/material';
import { useRef } from 'react';

export const TextFieldInput = ({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (url: string) => void;
} & Omit<TextFieldProps, 'onChange'>) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePasteClipBoard = async () => {
    if (inputRef.current) {
      const url = await navigator.clipboard.readText();

      inputRef.current.value = url;

      onChange(url);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      onChange('');
    }
  };

  return (
    <TextField
      fullWidth
      inputRef={inputRef}
      value={value}
      onChange={(event) => {
        const value = event.target.value;
        onChange(value);
      }}
      InputProps={{
        endAdornment: (
          <>
            <Tooltip
              onClick={() => {
                handlePasteClipBoard();
              }}
              title="paste clipboard"
            >
              <IconButton
                onClick={() => {
                  handlePasteClipBoard();
                }}
              >
                <ContentPasteIcon />
              </IconButton>
            </Tooltip>

            <Tooltip
              title="clear"
              onClick={() => {
                handleClear();
              }}
            >
              <IconButton
                onClick={() => {
                  handleClear();
                }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </>
        ),
      }}
      {...props}
    />
  );
};
