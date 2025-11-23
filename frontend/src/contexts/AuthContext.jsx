import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

// Backend base URL from Vite env (prod) or localhost (dev)
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  /*
   * On mount, check for a stored token:
   *  - If present, call GET /user/me and set user.
   *  - If not present or invalid, clear user and token.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/user/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Token invalid/expired
          localStorage.removeItem("token");
          setUser(null);
          return;
        }

        const data = await res.json();
        // Backend returns { user: {...} }
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching /user/me:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  /*
   * Logout the currently authenticated user.
   *
   * This function will always navigate to "/".
   */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  /**
   * Login a user with their credentials.
   *
   * Upon success, navigates to "/profile".
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   * @returns {string | null} - Upon failure, returns an error message; on success, null.
   */
  const login = async (username, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Expected format: { message: "error message" }
        return data.message || "Login failed";
      }

      const token = data.token;
      localStorage.setItem("token", token);

      // Fetch the user profile to populate context
      try {
        const profileRes = await fetch(`${BACKEND_URL}/user/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching profile after login:", err);
        setUser(null);
      }

      navigate("/profile");
      return null; // success, no error message
    } catch (err) {
      console.error("Login network error:", err);
      return "Network error while logging in";
    }
  };

  /**
   * Registers a new user.
   *
   * Upon success, navigates to "/success".
   * @param {Object} userData - { username, firstname, lastname, password }
   * @returns {string | null} - Upon failure, returns an error message; on success, null.
   */
  const register = async (userData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Expected format: { message: "error message" }
        return data.message || "Registration failed";
      }

      // On success go to success page
      navigate("/success");
      return null;
    } catch (err) {
      console.error("Register network error:", err);
      return "Network error while registering";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
