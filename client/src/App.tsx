import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import DownloadIcon from "@mui/icons-material/Download";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { LoadingButton } from "@mui/lab";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  PaperProps,
  Skeleton,
  Typography,
} from "@mui/material";
import React from "react";
import { useFetchScreenshotMutation } from "./screenshot-data-access";
import {
  ScreenshotTypeInput,
  useScreenshotTypeInputState,
} from "./ScreenshotTypeInput";
import {
  ScreenshotUrlInput,
  useScreenshotUrlInputState,
  validateScreenshotUrl,
} from "./ScreenshotUrlInput";

export const App = () => {
  const { url, setUrl } = useScreenshotUrlInputState();
  const { type, changeType } = useScreenshotTypeInputState();

  const errors = [...validateScreenshotUrl(url)];

  const fetchScreenshotMutation = useFetchScreenshotMutation();

  const handleTakeScreenshot = async () => {
    fetchScreenshotMutation.mutate({
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

        <LoadingButton
          startIcon={<PhotoCameraIcon />}
          fullWidth
          size="large"
          variant="contained"
          sx={{
            marginBottom: 4,
          }}
          disabled={errors.length > 0}
          onClick={handleTakeScreenshot}
          loading={fetchScreenshotMutation.status === "loading"}
        >
          Take Screenshot
        </LoadingButton>

        {fetchScreenshotMutation.error && (
          <Box sx={{ marginBottom: 4 }}>
            {fetchScreenshotMutation.error.map((error) => (
              <Alert
                key={error.message}
                severity="error"
                sx={{ marginBottom: 2 }}
              >
                <AlertTitle>Server Error</AlertTitle>
                {JSON.stringify(error, null, 4)}
              </Alert>
            ))}
          </Box>
        )}
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
          state={fetchScreenshotMutation.status}
          alt={`screenshot of ${url}`}
          src={fetchScreenshotMutation.data?.src}
        />

        {fetchScreenshotMutation.status === "success" &&
          fetchScreenshotMutation.data.src && (
            <>
              <Button
                sx={{ marginTop: 4 }}
                fullWidth
                size="large"
                variant="contained"
                startIcon={<DownloadIcon />}
                title={url}
                href={fetchScreenshotMutation.data.src}
                download={fetchScreenshotMutation.data.src}
              >
                Download Screenshot
              </Button>
            </>
          )}
      </Container>
    </>
  );
};

const Screenshot = ({
  alt,
  src,
  state,
  sx,
  ...props
}: {
  alt: string;
  src?: string;
  state: "loading" | "error" | "success" | "idle";
} & PaperProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        position: "relative",
        height: "0",
        paddingTop: "75%",
        width: "100%",
        ...sx,
      }}
      {...props}
    >
      {state === "success" && (
        <img
          src={src ?? ""}
          alt={alt}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}

      {state === "loading" && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Skeleton
            animation="wave"
            width="100%"
            height="100%"
            variant="rectangular"
          />
        </Box>
      )}

      {state === "error" && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          color="text.secondary"
        >
          <BrokenImageIcon />
        </Box>
      )}
    </Paper>
  );
};
