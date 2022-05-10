import { Session } from "@supabase/supabase-js";
import constate from "constate";
import { useEffect, useState } from "react";
import { supabaseClient } from "./supabase";

type IAuthState =
  | { type: "Loading" }
  | { type: "LoggedIn"; userId: string }
  | { type: "LoggedOut" };

const toAuthState = (session: Session | null): IAuthState => {
  const userId = session?.user?.id;

  if (userId) {
    return { type: "LoggedIn", userId: userId };
  }

  return { type: "LoggedOut" };
};

export const useAuthState = () => {
  const [authState, setAuthState] = useState<IAuthState>({ type: "Loading" });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAuthState(toAuthState(supabaseClient.auth.session()));
    }, 1000);

    supabaseClient.auth.onAuthStateChange((event, session) => {
      clearTimeout(timeout);
      setAuthState(toAuthState(session));
    });
  }, []);

  return authState;
};

export const [AuthUserContext, useAuthUser] = constate(
  ({ userId }: { userId: string }) => {
    return {
      userId,
    };
  }
);
