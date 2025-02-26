import { useState } from "react";
import { useNostr } from "../context/NostrContext";
import { nip19 } from "nostr-tools";

export const FollowUser = () => {
  const { followUser, unfollowUser, isFollowing, getProfileByPubkey } =
    useNostr();
  const [npubInput, setNpubInput] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    pubkey: string;
    name: string;
    about: string;
    picture: string;
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!npubInput.trim()) {
      setStatus("Please enter an npub");
      return;
    }

    setIsLoading(true);
    setStatus("Searching...");

    try {
      // Check if input is a valid npub
      if (!npubInput.startsWith("npub1")) {
        setStatus("Invalid npub format. Must start with 'npub1'");
        setSearchResult(null);
        setIsLoading(false);
        return;
      }

      // Decode the npub to get the pubkey
      const { data: pubkey } = nip19.decode(npubInput);

      // Get profile data
      const profile = await getProfileByPubkey(pubkey as string);

      if (profile) {
        setSearchResult({
          pubkey: pubkey as string,
          name: profile.name,
          about: profile.about,
          picture: profile.picture,
        });
        setStatus("");
      } else {
        setSearchResult(null);
        setStatus("No profile found for this npub");
      }
    } catch (error) {
      console.error("Failed to search for user:", error);
      setSearchResult(null);
      setStatus("Invalid npub or network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = () => {
    if (!searchResult) return;

    followUser(searchResult.pubkey);
    setStatus("User followed successfully!");
  };

  const handleUnfollow = () => {
    if (!searchResult) return;

    unfollowUser(searchResult.pubkey);
    setStatus("User unfollowed");
  };

  return (
    <div className='follow-user'>
      <h2>Follow User</h2>
      <form onSubmit={handleSearch}>
        <div className='form-group'>
          <label htmlFor='npub'>Enter Nostr Public Key (npub):</label>
          <div className='search-input'>
            <input
              id='npub'
              type='text'
              value={npubInput}
              onChange={(e) => setNpubInput(e.target.value)}
              placeholder='npub1...'
              disabled={isLoading}
            />
            <button type='submit' disabled={isLoading || !npubInput.trim()}>
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {status && (
        <p
          className={`status ${
            status.includes("success") ? "success" : "error"
          }`}
        >
          {status}
        </p>
      )}

      {searchResult && (
        <div className='user-profile'>
          <div className='user-header'>
            {searchResult.picture && (
              <img
                src={searchResult.picture}
                alt={`${searchResult.name || "User"}'s avatar`}
                className='user-avatar'
              />
            )}
            <div className='user-info'>
              <h3>{searchResult.name || "Anonymous"}</h3>
              <p className='user-npub'>{npubInput}</p>
            </div>
          </div>

          {searchResult.about && (
            <p className='user-about'>{searchResult.about}</p>
          )}

          <div className='user-actions'>
            {isFollowing(searchResult.pubkey) ? (
              <button onClick={handleUnfollow} className='unfollow-button'>
                Unfollow
              </button>
            ) : (
              <button onClick={handleFollow} className='follow-button'>
                Follow
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
