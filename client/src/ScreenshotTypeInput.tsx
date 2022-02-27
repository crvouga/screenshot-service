import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React, { useState } from "react";

export const useScreenshotTypeInputState = () => {
  const [type, setType] = useState<"png" | "jpeg">("png");

  const changeType = (nextType: unknown) => {
    setType((currentType) => {
      if (nextType === "png" || nextType === "jpeg") {
        return nextType;
      }
      return currentType;
    });
  };

  return {
    type,
    changeType,
  };
};

export const ScreenshotTypeInput = ({
  type,
  onChange,
}: {
  type: string;
  onChange: (newType: string | null) => void;
}) => {
  return (
    <>
      <ToggleButtonGroup
        value={type}
        onChange={(_event, nextType) => {
          onChange(nextType);
        }}
        exclusive
        sx={{
          marginBottom: 4,
        }}
      >
        <ToggleButton value="png">PNG</ToggleButton>
        <ToggleButton value="jpeg">JPEG</ToggleButton>
      </ToggleButtonGroup>
    </>
  );
};
