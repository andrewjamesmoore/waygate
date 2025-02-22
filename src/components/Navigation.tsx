import { Link, useLocation, useNavigate } from "react-router-dom";
import { useNostr } from "../context/NostrContext";

export const Navigation = () => {
  const { privateKey, setPrivateKey } = useNostr();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setPrivateKey("");
    navigate("/login");
  };

  if (!privateKey || location.pathname === "/login") {
    return null;
  }

  return (
    <nav className='main-nav'>
      <div className='nav-brand'>
        <Link to='/feed'>Nostr Social</Link>
      </div>
      <div className='nav-links'>
        <Link
          to='/feed'
          className={location.pathname === "/feed" ? "active" : ""}
        >
          Feed
        </Link>
        <Link
          to='/settings'
          className={location.pathname === "/settings" ? "active" : ""}
        >
          Settings
        </Link>
        <button onClick={handleLogout} className='logout-button'>
          Logout
        </button>
      </div>
    </nav>
  );
};
