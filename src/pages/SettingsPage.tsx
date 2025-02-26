import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../components/Profile";
import { KeyManagement } from "../components/KeyManagement";
import { FollowUser } from "../components/FollowUser";
import { useNostr } from "../context/NostrContext";

export const SettingsPage = () => {
  const { privateKey, following, getProfileByPubkey, unfollowUser } =
    useNostr();
  const navigate = useNavigate();
  const [followingProfiles, setFollowingProfiles] = useState<
    Array<{
      pubkey: string;
      name: string;
      picture: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!privateKey) {
      navigate("/login");
    }
  }, [privateKey, navigate]);

  // Load following profiles
  useEffect(() => {
    const loadFollowingProfiles = async () => {
      if (following.length === 0) return;

      setIsLoading(true);
      const profiles = [];

      for (const pubkey of following) {
        try {
          const profile = await getProfileByPubkey(pubkey);
          if (profile) {
            profiles.push({
              pubkey,
              name: profile.name || "Anonymous",
              picture: profile.picture || "",
            });
          }
        } catch (error) {
          console.error(`Failed to load profile for ${pubkey}:`, error);
        }
      }

      setFollowingProfiles(profiles);
      setIsLoading(false);
    };

    loadFollowingProfiles();
  }, [following, getProfileByPubkey]);

  return (
    <div className='page settings-page'>
      <h1>Account Settings</h1>
      <KeyManagement />
      <Profile />
      <FollowUser />

      <div className='following-list'>
        <h3>Following ({following.length})</h3>
        {isLoading ? (
          <p>Loading following profiles...</p>
        ) : followingProfiles.length > 0 ? (
          followingProfiles.map((profile) => (
            <div key={profile.pubkey} className='following-item'>
              {profile.picture ? (
                <img
                  src={profile.picture}
                  alt={`${profile.name}'s avatar`}
                  className='following-avatar'
                />
              ) : (
                <div className='following-avatar' />
              )}
              <span className='following-name'>{profile.name}</span>
              <button
                onClick={() => unfollowUser(profile.pubkey)}
                className='unfollow-button'
              >
                Unfollow
              </button>
            </div>
          ))
        ) : (
          <p>You are not following anyone yet.</p>
        )}
      </div>
    </div>
  );
};
