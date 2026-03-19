import { Navigate } from 'react-router-dom';
import { getUserDataFromToken } from '../utils/authUtils';

const RoleGuard = ({ children, allowedRoles }) => {
  const user = getUserDataFromToken();

  // 1. Si no hay token o es inválido, al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si el rol del usuario no está en la lista de permitidos, al inicio
  if (!allowedRoles.includes(user.role)) {
    console.warn(`Acceso denegado para el rol: ${user.role}`);
    return <Navigate to="/inicio" replace />;
  }

  // 3. Si todo está en orden, renderiza la vista solicitada
  return children;
};

export default RoleGuard;