import DownloadIcon from "@mui/icons-material/Download";
import { Button, Container, Divider, Typography } from "@mui/material";
import React from "react";
import { Screenshot } from "./screenshot/Screenshot";
import { ScreenshotButton } from "./screenshot/ScreenshotButton";
import {
  ScreenshotTypeInput,
  useScreenshotTypeInputState,
} from "./screenshot/ScreenshotTypeInput";
import {
  ScreenshotUrlInput,
  useScreenshotUrlInputState,
  validateScreenshotUrl,
} from "./screenshot/ScreenshotUrlInput";
import { useScreenshot } from "./screenshot/use-screenshot";

export const App = () => {
  const { url, setUrl } = useScreenshotUrlInputState();
  const { type, changeType } = useScreenshotTypeInputState();

  const errors = [...validateScreenshotUrl(url)];

  const screenshot = useScreenshot();

  const handleTakeScreenshot = async () => {
    screenshot.fetch({
      targetUrl: url,
      timeout: 1000,
      imageType: type,
    });
  };

  return (
    <>
      <Typography variant="h4" align="center" sx={{ marginY: 4 }}>
        Screenshot Service
      </Typography>

      <Divider
        sx={{
          marginBottom: 4,
        }}
      />

      <Container maxWidth="sm" sx={{ overflowX: "hidden" }}>
        <Typography gutterBottom color="text.secondary">
          URL
        </Typography>

        <ScreenshotUrlInput
          url={url}
          onChange={setUrl}
          helperText={validateScreenshotUrl(url).join(", ")}
        />

        <Typography gutterBottom color="text.secondary">
          Type
        </Typography>

        <ScreenshotTypeInput type={type} onChange={changeType} />

        <ScreenshotButton
          disabled={errors.length > 0}
          onClick={handleTakeScreenshot}
          loading={screenshot.state === "loading"}
        />
      </Container>

      <Divider
        sx={{
          marginBottom: 4,
        }}
      />

      <Container
        maxWidth="sm"
        sx={{
          marginBottom: 4,
        }}
      >
        <Screenshot
          state={screenshot.state}
          alt={`screenshot of ${url}`}
          src={screenshot.src}
        />

        {screenshot.state === "success" && screenshot.src && (
          <>
            <Button
              sx={{ marginTop: 4 }}
              fullWidth
              size="large"
              variant="contained"
              startIcon={<DownloadIcon />}
              title={url}
              href={screenshot.src}
              download={screenshot.src}
            >
              Download Screenshot
            </Button>
          </>
        )}
      </Container>
    </>
  );
};
