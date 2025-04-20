import { SupabaseClient } from '@supabase/supabase-js';
import { IAuthApi } from './interface';
import { Data } from '@screenshot-service/screenshot-service';

export const SupabaseAuthApi = ({
  supabaseClient,
}: {
  supabaseClient: SupabaseClient;
}): IAuthApi => {
  return {
    loginWithGoogle: async ({ redirectTo }) => {
      await supabaseClient.auth.signIn({ provider: 'google' }, { redirectTo });
    },
    getCurrentUser: async () => {
      const session = await supabaseClient.auth.session();

      if (!session || !session.user) {
        return null;
      }

      const decodedUserId = Data.UserId.decode(session.user.id);
      if (decodedUserId.type !== 'Ok') {
        return null;
      }

      return { userId: decodedUserId.value };
    },
    logout: async () => {
      await supabaseClient.auth.signOut();
    },
  };
};
