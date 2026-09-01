import { createContext, useState, useEffect } from "react";
import { registerUser, loginUser, getCurrentUser } from "../services/authService";
import { getToken, setToken, clearToken } from "../services/tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sirf token store hota hai, user nahi. User hamesha /auth/me se aata hai,
  // taake role aur naam server ki sachai hon — kisi aisi cheez se na hon jo
  // browser mein pari ho aur badli ja sakti ho.
  useEffect(() => {
    const token = getToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => setUser(data))
      .catch(() => {
        clearToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Pichhla `storage` event listener jaan bujh kar hata diya gaya hai. Uski
  // zaroorat localStorage ki wajah se thi: sab tabs ek hi storage share karte
  // the, to ek tab ki tabdeeli baaqi tabs ko batani parti thi. sessionStorage
  // har tab ka apna hai, is liye ab koi tab kisi doosre ko chhurta hi nahi —
  // aur wo listener hi to Tab A ko chupke se exhibitor bana raha tha.

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    setToken(data.token);
    setUser(data);
    return data;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    setToken(data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}