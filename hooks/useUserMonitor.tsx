import { useEffect } from 'react';
import { useAtom } from 'jotai';
import useSpotifyAuthentication from './spotify/useSpotifyAuthentication';
import { userAtom } from '../state/userAtom';
import User from '../models/User';
import { useRouter } from 'next/router';
import supabase from '../util/supabase';
import { isPremiumAtom } from '../state/isPremiumAtom';
import useStore from 'state/store';

type Options = {
  shouldRedirect?: boolean;
};

const useUserMonitor = (
  options: Options = {
    shouldRedirect: true,
  }
) => {
  const { shouldRedirect = true } = options;

  const router = useRouter();
  const { spotify } = useStore((store) => ({
    spotify: store.spotify,
  }));
  const [user, setUser] = useAtom(userAtom);
  const [, setIsPremium] = useAtom(isPremiumAtom);
  const { isLoading, accessToken } = useSpotifyAuthentication({
    shouldRedirect,
  });

  useEffect(() => {
    const updateUser = async () => {
      if (!accessToken || isLoading) return;
      try {
        spotify.setAccessToken(accessToken);
        const spotifyUser = await spotify.getMe();

        setIsPremium(spotifyUser.product === 'premium');

        let { data: users, error } = await supabase
          .from('users')
          .select('*')
          .eq('serviceId', spotifyUser.id);

        if (users && users.length > 0) {
          setUser(users[0] as User);
        }
      } catch (error) {
        if (shouldRedirect) {
          router.push('/api/spotify/login');
        }
      }
    };

    if (accessToken && !user.id) updateUser();
  }, [accessToken, isLoading, user, setUser]);

  return isLoading;
};

export default useUserMonitor;
