import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import React from "react";

export const ScreenshotButton = (props: LoadingButtonProps) => {
  return (
    <LoadingButton
      startIcon={<PhotoCameraIcon />}
      fullWidth
      size="large"
      variant="contained"
      sx={{
        marginBottom: 4,
      }}
      {...props}
    >
      Take Screenshot
    </LoadingButton>
  );
};
