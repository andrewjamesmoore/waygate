import { useState, useEffect } from "react";
import { useNostr } from "../context/NostrContext";

export const Profile = () => {
  const { profile, updateProfile, privateKey } = useNostr();
  const [name, setName] = useState(profile.name);
  const [about, setAbout] = useState(profile.about);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setName(profile.name);
    setAbout(profile.about);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, about);
    setStatus("Profile updated successfully!");
    setTimeout(() => setStatus(""), 3000);
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

      {status && <p className='status success'>{status}</p>}
    </div>
  );
};
