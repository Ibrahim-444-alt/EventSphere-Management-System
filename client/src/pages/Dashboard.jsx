import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { roleHome } from "../utils/roleHome";

// Ye page ab khud kuch nahi dikhata, sirf sahi portal par bhej deta hai.
// Route poori tarah hata dena aasan tha, magar phir har purana link aur
// bookmark jo /dashboard par jata tha, wo toot jata. Is tarah wo sab bhi
// theek jagah pahunchte hain.
//
// user ka mojood hona yaqeeni hai: AppRoutes mein ye route ProtectedRoute
// ke andar hai, to bina login yahan koi pahunch hi nahi sakta.
function Dashboard() {
  const { user } = useAuth();

  return <Navigate to={roleHome(user.role)} replace />;
}

export default Dashboard;