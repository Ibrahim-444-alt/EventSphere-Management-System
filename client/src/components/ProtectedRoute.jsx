import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { roleHome } from "../utils/roleHome";

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Ghalat portal ka URL type kiya? Error dikhane ke bajaye chupke se usi ke
  // apne portal par bhej dete hain. Yaad rahe: asli pehra server par hai —
  // authorize() har API call par role check karta hai. Ye line sirf UI ko
  // sharif rakhti hai, security ka bharosa is par nahi.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;