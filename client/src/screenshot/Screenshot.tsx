import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import { BoxProps, Box, Skeleton } from "@mui/material";
import React from "react";

export const Screenshot = ({
  alt,
  src,
  state,
  ...BoxProps
}: {
  alt: string;
  src: string | null;
  state: "loading" | "error" | "success" | "idle";
} & BoxProps) => {
  return (
    <Box
      position="relative"
      height="0"
      paddingTop="75%"
      width="100%"
      {...BoxProps}
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
    </Box>
  );
};
