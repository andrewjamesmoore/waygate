import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../components/Profile";
import { KeyManagement } from "../components/KeyManagement";
import { useNostr } from "../context/NostrContext";

export const SettingsPage = () => {
  const { privateKey } = useNostr();
  const navigate = useNavigate();

  useEffect(() => {
    if (!privateKey) {
      navigate("/login");
    }
  }, [privateKey, navigate]);

  return (
    <div className='page settings-page'>
      <h1>Account Settings</h1>
      <KeyManagement />
      <Profile />
    </div>
  );
};
