import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PostNote } from "../components/PostNote";
import { useNostr } from "../context/NostrContext";

export const FeedPage = () => {
  const { privateKey, posts, profile } = useNostr();
  const navigate = useNavigate();

  useEffect(() => {
    if (!privateKey) {
      navigate("/login");
    }
  }, [privateKey, navigate]);

  return (
    <div className='page feed-page'>
      <h1>Feed</h1>
      <PostNote />
      <div className='posts-list'>
        {posts.map((post) => (
          <div key={post.id} className='post'>
            <div className='post-header'>
              {profile.avatar && (
                <img
                  src={profile.avatar}
                  alt='Avatar'
                  className='post-avatar'
                />
              )}
              <div>
                {profile.name && (
                  <div className='post-author'>{profile.name}</div>
                )}
              </div>
            </div>
            <div className='post-content'>{post.content}</div>
            <div className='post-meta'>
              {new Date(post.created_at * 1000).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
