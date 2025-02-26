import { useState, useEffect, useRef } from "react";
import { useNostr } from "../context/NostrContext";

export const Profile = () => {
  const { profile, updateProfile, privateKey } = useNostr();
  const [name, setName] = useState(profile.name);
  const [about, setAbout] = useState(profile.about);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.name);
    setAbout(profile.about);
    setAvatar(profile.avatar);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, about, avatar);
    setStatus("Profile updated successfully!");
    setTimeout(() => setStatus(""), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setStatus("error:Image is too large. Please select an image under 2MB.");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (!privateKey) {
    return (
      <div className='profile'>
        <h2>Profile</h2>
        <p>Please add a key to manage your profile.</p>
      </div>
    );
  }

  return (
    <div className='profile'>
      <h2>Profile</h2>
      <form onSubmit={handleSubmit}>
        <div
          className={`avatar-preview ${!avatar ? "avatar-placeholder" : ""}`}
          onClick={handleAvatarClick}
        >
          {avatar ? (
            <img src={avatar} alt='Profile avatar' />
          ) : (
            <div className='avatar-upload-icon'>+</div>
          )}
        </div>
        <p className='avatar-help-text'>Click the avatar to upload an image</p>

        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          accept='image/*'
          style={{ display: "none" }}
        />

        <div className='form-group'>
          <label htmlFor='name'>Name:</label>
          <input
            id='name'
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Your name'
          />
        </div>

        <div className='form-group'>
          <label htmlFor='about'>About:</label>
          <textarea
            id='about'
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder='Tell us about yourself'
            rows={4}
          />
        </div>

        <button type='submit'>Update Profile</button>
      </form>

      {status && (
        <p
          className={`status ${
            status.startsWith("error:") ? "error" : "success"
          }`}
        >
          {status.startsWith("error:") ? status.substring(6) : status}
        </p>
      )}
    </div>
  );
};
