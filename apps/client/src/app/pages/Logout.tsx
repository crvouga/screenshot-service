import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../supabase";

export const LogoutPage = () => {
  const navigate = useNavigate();

  const onCancel = () => {
    navigate(-1);
  };

  const onLogout = () => {
    supabaseClient.auth.signOut();
  };

  return (
    <Dialog open onClose={onCancel}>
      <DialogTitle>logout of screenshot service?</DialogTitle>
      <DialogActions>
        <Button onClick={onCancel}>cancel</Button>
        <Button onClick={onLogout}>logout</Button>
      </DialogActions>
    </Dialog>
  );
};
