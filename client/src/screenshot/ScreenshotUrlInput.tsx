import ClearIcon from "@mui/icons-material/Clear";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import React, { useRef, useState } from "react";

export const validateUrl = (url: string) => {
  try {
    new URL(url);

    return [];
  } catch (error) {
    return [new Error("Invalid URL")];
  }
};

export const validateScreenshotUrl = (url: string): Error[] => {
  const errors = validateUrl(url);

  if (errors.length > 0) {
    return errors;
  }

  if (url.includes("#")) {
    return [new Error(`URL's are not allowed to contain "#"`)];
  }

  return [];
};

export const useScreenshotUrlInputState = () => {
  const [url, setUrl] = useState("");

  return {
    url,
    setUrl,
  };
};

export const ScreenshotUrlInput = ({
  url,
  onChange,
  ...props
}: {
  url: string;
  onChange: (url: string) => void;
} & Omit<TextFieldProps, "onChange">) => {
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  const handlePasteClipBoard = async () => {
    if (urlInputRef.current) {
      const url = await navigator.clipboard.readText();

      urlInputRef.current.value = url;

      onChange(url);
    }
  };

  const handleClear = () => {
    if (urlInputRef.current) {
      urlInputRef.current.value = "";
      onChange("");
    }
  };

  return (
    <TextField
      sx={{ marginBottom: 2 }}
      fullWidth
      inputRef={urlInputRef}
      id="url"
      placeholder="https://www.example.com/"
      value={url}
      onChange={(event) => {
        const url = event.target.value;
        onChange(url);
      }}
      InputProps={{
        endAdornment: (
          <>
            <InputAdornment
              position="end"
              sx={{
                cursor: "pointer",
              }}
              onClick={() => {
                handlePasteClipBoard();
              }}
            >
              <ContentPasteIcon />
            </InputAdornment>
            <InputAdornment
              position="end"
              sx={{
                cursor: "pointer",
              }}
              onClick={() => {
                handleClear();
              }}
            >
              <ClearIcon />
            </InputAdornment>
          </>
        ),
      }}
      {...props}
    />
  );
};
