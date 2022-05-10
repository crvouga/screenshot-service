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
      <DialogTitle>Logout of Screenshot Service?</DialogTitle>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onLogout}>Logout</Button>
      </DialogActions>
    </Dialog>
  );
};
