import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import DownloadIcon from "@mui/icons-material/Download";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { LoadingButton } from "@mui/lab";
import {
  Alert,
  AlertTitle,
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  PaperProps,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { castTargetUrl } from "../../shared/screenshot-data";
import { useFetchScreenshotMutation } from "../screenshot-data-access";
import { TextFieldInput } from "../TextField";

export const GetScreenshotPage = () => {
  const [targetUrl, setTargetUrl] = useState("");
  const [imageType, setImageType] = useState<"png" | "jpeg">("jpeg");
  const [timeoutMs, setTimeoutMs] = useState("1000");
  const [maxAgeMs, setMaxAgeMs] = useState<string>("");

  const castedTargetUrl = castTargetUrl(targetUrl);

  const targetUrlHelperText =
    castedTargetUrl.type === "error"
      ? castedTargetUrl.errors.map((error) => error.message).join(", ")
      : "";

  const fetchScreenshotMutation = useFetchScreenshotMutation();

  const error =
    fetchScreenshotMutation.status === "error"
      ? fetchScreenshotMutation.error
      : [];

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" align="center">
            Screenshot Service
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ marginTop: 2, overflowX: "hidden" }}>
        <Typography gutterBottom color="text.secondary">
          targetUrl
        </Typography>

        <TextFieldInput
          type="url"
          value={targetUrl}
          onChange={setTargetUrl}
          helperText={targetUrlHelperText}
          id="targetUrl"
          placeholder="https://www.example.com/"
          sx={{ marginBottom: 2 }}
        />

        <Typography gutterBottom color="text.secondary">
          imageType
        </Typography>

        <ToggleButtonGroup
          value={imageType}
          onChange={(_event, value) => {
            if (value === "png" || value === "jpeg") {
              setImageType(value);
            }
          }}
          exclusive
          sx={{
            marginBottom: 2,
          }}
        >
          <ToggleButton value="png">PNG</ToggleButton>
          <ToggleButton value="jpeg">JPEG</ToggleButton>
        </ToggleButtonGroup>

        <Typography gutterBottom color="text.secondary">
          timeoutMs
        </Typography>

        <TextFieldInput
          id="timeoutMs"
          placeholder="3000"
          type="number"
          value={timeoutMs}
          onChange={setTimeoutMs}
          sx={{ marginBottom: 2 }}
        />

        <Typography gutterBottom color="text.secondary">
          maxAgeMs
        </Typography>

        <TextFieldInput
          id="maxAgeMs"
          type="number"
          placeholder="Infinity"
          value={maxAgeMs}
          onChange={setMaxAgeMs}
          sx={{ marginBottom: 2 }}
        />

        {error.length > 0 && (
          <Box sx={{ marginY: 2 }}>
            {error.map((error) => (
              <Alert
                key={error.message}
                severity="error"
                sx={{ marginBottom: 2 }}
              >
                <AlertTitle>Server Error</AlertTitle>
                {error.message}
              </Alert>
            ))}
          </Box>
        )}

        <LoadingButton
          startIcon={<PhotoCameraIcon />}
          fullWidth
          size="large"
          variant="contained"
          sx={{
            marginTop: 2,
            marginBottom: 4,
          }}
          onClick={() => {
            fetchScreenshotMutation.mutate({
              targetUrl,
              timeoutMs,
              imageType,
              maxAgeMs,
            });
          }}
          loading={fetchScreenshotMutation.status === "loading"}
        >
          Take Screenshot
        </LoadingButton>
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
          alt={`screenshot of ${targetUrl}`}
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
                title={targetUrl}
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
