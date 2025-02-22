import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyManagement } from "../components/KeyManagement";
import { useNostr } from "../context/NostrContext";

export const LoginPage = () => {
  const { privateKey } = useNostr();
  const navigate = useNavigate();

  useEffect(() => {
    if (privateKey) {
      navigate("/feed");
    }
  }, [privateKey, navigate]);

  return (
    <div className='page login-page'>
      <h1>Welcome to Nostr Social</h1>
      <p className='subtitle'>
        Get started by generating a new key or importing an existing one.
      </p>
      <KeyManagement />
    </div>
  );
};
