import { ContentPaste, History } from '@mui/icons-material';
import {
  Autocomplete,
  IconButton,
  TextField,
  TextFieldProps,
} from '@mui/material';
import useLocalStorage from 'apps/client/src/lib/use-local-storage';
import * as React from 'react';

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
}: {
  targetUrl: string;
  setTargetUrl: (targetUrl: string) => void;
  projectId: string;
}) => {
  const [history, setHistory] = useLocalStorage<string[]>(
    'targetUrlHistory',
    []
  );

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
    console.log('PASTE', text);
    setTargetUrl(text);
    addToHistory(text);
  };

  return (
    <Autocomplete
      freeSolo
      options={history}
      inputValue={targetUrl}
      onInputChange={(_, value) => {
        setTargetUrl(value);
      }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            placeholder="https://www.example.com/"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  <IconButton onClick={handlePaste}>
                    <ContentPaste />
                  </IconButton>
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        );
      }}
    />
  );
};
