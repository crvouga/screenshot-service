import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  createTheme,
  responsiveFontSizes,
  ThemeProvider,
} from "@mui/material/styles";
import React, { useRef, useState } from "react";
import { Screenshot } from "./screenshot/Screenshot";
import { useScreenshot } from "./screenshot/use-screenshot";

const theme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: "dark",
    },
    typography: {
      fontFamily: "monospace",
    },
  })
);

export const App = () => {
  const [url, setUrl] = useState("");
  const [delay] = useState(1000);
  const [type, setType] = useState<"png" | "jpeg">("png");

  const handleChangeType = (nextType: unknown) => {
    setType((currentType) => {
      if (nextType === "png" || nextType === "jpeg") {
        return nextType;
      }
      return currentType;
    });
  };

  const urlInputRef = useRef<HTMLInputElement | null>(null);

  const screenshot = useScreenshot();

  const handleTakeSnapshot = async () => {
    screenshot.fetch({
      targetUrl: url,
      timeout: delay,
      imageType: type,
    });
  };

  const handlePasteClipBoard = async () => {
    if (urlInputRef.current) {
      const url = await navigator.clipboard.readText();

      urlInputRef.current.value = url;

      setUrl(url);
    }
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ paddingTop: 4, overflowX: "hidden" }}>
          <Typography variant="h4" align="center" sx={{ marginBottom: 4 }}>
            Screenshot Service
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <TextField
              fullWidth
              inputRef={urlInputRef}
              id="url"
              label="Website URL"
              value={url}
              onChange={(event) => {
                const url = event.target.value;
                setUrl(url);
              }}
            />
            <IconButton size="large" onClick={handlePasteClipBoard}>
              <ContentPasteIcon />
            </IconButton>
          </Box>

          <Typography gutterBottom color="text.secondary">
            Type
          </Typography>

          <ToggleButtonGroup
            value={type}
            onChange={(_event, nextType) => {
              handleChangeType(nextType);
            }}
            exclusive
            sx={{
              marginBottom: 4,
            }}
          >
            <ToggleButton value="png">PNG</ToggleButton>
            <ToggleButton value="jpeg">JPEG</ToggleButton>
          </ToggleButtonGroup>

          <LoadingButton
            onClick={handleTakeSnapshot}
            loading={screenshot.state === "loading"}
            startIcon={<PhotoCameraIcon />}
            fullWidth
            size="large"
            variant="contained"
            sx={{
              marginBottom: 4,
            }}
          >
            Take Screenshot
          </LoadingButton>
        </Container>

        <Divider
          sx={{
            marginBottom: 4,
          }}
        />

        <Container maxWidth="sm">
          <Screenshot
            state={screenshot.state}
            alt={`screenshot of ${url}`}
            src={screenshot.src}
            sx={{
              marginBottom: 4,
            }}
          />
        </Container>
      </ThemeProvider>
    </>
  );
};
