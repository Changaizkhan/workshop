import { Navigate } from 'react-router-dom';
import { canAccessTab } from '../permissions';
import { firstAllowedPath } from '../routes';

export default function ProtectedRoute({ user, tab, children }) {
  if (!canAccessTab(user, tab)) {
    return <Navigate to={firstAllowedPath(user)} replace />;
  }
  return children;
}
