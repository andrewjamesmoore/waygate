import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PostNote } from "../components/PostNote";
import { CommentNote } from "../components/CommentNote";
import { useNostr } from "../context/NostrContext";

// Type for post with author info
interface PostWithAuthor {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  author: {
    name: string;
    picture: string;
  };
  comments?: CommentWithAuthor[];
}

// Type for comment with author info
interface CommentWithAuthor {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  author: {
    name: string;
    picture: string;
  };
}

export const FeedPage = () => {
  const {
    privateKey,
    publicKey,
    posts,
    profile,
    getProfileByPubkey,
    followUser,
    unfollowUser,
    isFollowing,
  } = useNostr();
  const navigate = useNavigate();
  const [postsWithAuthors, setPostsWithAuthors] = useState<PostWithAuthor[]>(
    []
  );
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [expandedCommentForms, setExpandedCommentForms] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (!privateKey) {
      navigate("/login");
    }
  }, [privateKey, navigate]);

  // Load author profiles for posts
  useEffect(() => {
    const loadAuthorProfiles = async () => {
      if (posts.length === 0) return;

      setIsLoadingProfiles(true);

      // Get unique pubkeys from posts
      const uniquePubkeys = [...new Set(posts.map((post) => post.pubkey))];
      const authorProfiles: Record<string, { name: string; picture: string }> =
        {};

      // Load profiles for each unique pubkey
      for (const pubkey of uniquePubkeys) {
        try {
          // If it's the user's own pubkey, use the local profile
          if (pubkey === publicKey) {
            authorProfiles[pubkey] = {
              name: profile.name || "You",
              picture: profile.avatar || "",
            };
            continue;
          }

          // Otherwise fetch from network
          const authorProfile = await getProfileByPubkey(pubkey);
          if (authorProfile) {
            authorProfiles[pubkey] = {
              name: authorProfile.name || "Anonymous",
              picture: authorProfile.picture || "",
            };
          } else {
            authorProfiles[pubkey] = {
              name: "Anonymous",
              picture: "",
            };
          }
        } catch (error) {
          console.error(`Failed to load profile for ${pubkey}:`, error);
          authorProfiles[pubkey] = {
            name: "Anonymous",
            picture: "",
          };
        }
      }

      // Combine posts with author profiles and process comments
      const enrichedPosts = posts.map((post) => {
        // Process comments if they exist
        const enrichedComments = post.comments
          ? post.comments.map((comment) => ({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              pubkey: comment.pubkey,
              author: authorProfiles[comment.pubkey] || {
                name: "Anonymous",
                picture: "",
              },
            }))
          : [];

        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          pubkey: post.pubkey,
          author: authorProfiles[post.pubkey] || {
            name: "Anonymous",
            picture: "",
          },
          comments: enrichedComments,
        };
      });

      setPostsWithAuthors(enrichedPosts);
      setIsLoadingProfiles(false);
    };

    loadAuthorProfiles();
  }, [posts, profile, getProfileByPubkey]);

  const handleFollowAuthor = (pubkey: string) => {
    followUser(pubkey);
  };

  const handleUnfollowAuthor = (pubkey: string) => {
    unfollowUser(pubkey);
  };

  const toggleCommentForm = (postId: string) => {
    setExpandedCommentForms((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  return (
    <div className='page feed-page'>
      <h1>Feed</h1>

      <div className='chat-container'>
        <div className='messages-container'>
          {posts.length === 0 && !isLoadingProfiles && (
            <div className='empty-state'>
              <p>No posts yet. Follow some users or create your first post!</p>
            </div>
          )}

          {isLoadingProfiles && posts.length > 0 && (
            <div className='loading-state'>
              <p>Loading posts...</p>
            </div>
          )}

          {postsWithAuthors.map((post) => (
            <div key={post.id} className='message'>
              <div className='message-header'>
                {post.author.picture ? (
                  <img
                    src={post.author.picture}
                    alt='Avatar'
                    className='message-avatar'
                  />
                ) : (
                  <div className='message-avatar' />
                )}
                <div className='message-author-info'>
                  <div className='message-author'>
                    {post.author.name}
                    {post.pubkey !== publicKey &&
                      (isFollowing(post.pubkey) ? (
                        <button
                          onClick={() => handleUnfollowAuthor(post.pubkey)}
                          className='small-button unfollow-button'
                        >
                          Unfollow
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollowAuthor(post.pubkey)}
                          className='small-button follow-button'
                        >
                          Follow
                        </button>
                      ))}
                  </div>
                  <div className='message-time'>
                    {new Date(post.created_at * 1000).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className='message-content'>{post.content}</div>

              {/* Comment section */}
              <div className='message-actions'>
                <button
                  className='comment-button'
                  onClick={() => toggleCommentForm(post.id)}
                >
                  {expandedCommentForms.includes(post.id)
                    ? "Hide Reply"
                    : "Reply"}
                </button>
              </div>

              {/* Comments */}
              {post.comments && post.comments.length > 0 && (
                <div className='comments-section'>
                  {post.comments.map((comment) => (
                    <div key={comment.id} className='comment'>
                      <div className='comment-header'>
                        {comment.author.picture ? (
                          <img
                            src={comment.author.picture}
                            alt='Avatar'
                            className='comment-avatar'
                          />
                        ) : (
                          <div className='comment-avatar' />
                        )}
                        <div className='comment-author-info'>
                          <span className='comment-author'>
                            {comment.author.name}
                          </span>
                          <span className='comment-time'>
                            {new Date(
                              comment.created_at * 1000
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className='comment-content'>{comment.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment form */}
              {expandedCommentForms.includes(post.id) && (
                <div className='comment-form-container'>
                  <CommentNote
                    parentId={post.id}
                    onCommentAdded={() => {
                      // Keep the form open after comment is added
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className='input-container'>
          <PostNote />
        </div>
      </div>
    </div>
  );
};
