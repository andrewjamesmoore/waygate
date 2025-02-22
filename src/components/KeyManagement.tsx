import { useState } from "react";
import { useNostr } from "../context/NostrContext";

export const KeyManagement = () => {
  const { privateKey, npub, generateNewKey, setPrivateKey } = useNostr();
  const [inputKey, setInputKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const handleImportKey = () => {
    if (inputKey.trim()) {
      setPrivateKey(inputKey.trim());
      setInputKey("");
    }
  };

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopyStatus(`${type} copied to clipboard!`);
    setTimeout(() => setCopyStatus(""), 2000);
  };

  return (
    <div className='key-management'>
      <h2>Key Management</h2>
      {privateKey ? (
        <div className='key-display'>
          <div className='key-section'>
            <p>Your public key (npub):</p>
            <div className='key-container'>
              <code className='npub'>{npub}</code>
              <button
                onClick={() => handleCopy(npub || "", "Public key")}
                className='copy-button'
              >
                Copy
              </button>
            </div>
          </div>

          <div className='key-section'>
            <p>Your private key (nsec):</p>
            <div className='key-container'>
              <code className='nsec'>
                {showPrivateKey
                  ? privateKey
                  : "••••••••••••••••••••••••••••••••"}
              </code>
              <div className='key-actions-row'>
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className='toggle-button'
                >
                  {showPrivateKey ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => handleCopy(privateKey, "Private key")}
                  className='copy-button'
                >
                  Copy
                </button>
              </div>
            </div>
            <p className='key-warning'>
              ⚠️ Save your private key! You'll need it to sign back in. Never
              share it with anyone!
            </p>
          </div>

          {copyStatus && <p className='copy-status success'>{copyStatus}</p>}
        </div>
      ) : (
        <>
          <p className='subtitle'>
            Get started by generating a new key or importing an existing one.
          </p>
          <div className='key-actions'>
            <button onClick={generateNewKey}>Generate New Key</button>

            <div className='import-key'>
              <input
                type='text'
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder='Enter private key (hex format)'
              />
              <button onClick={handleImportKey}>Import Key</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
