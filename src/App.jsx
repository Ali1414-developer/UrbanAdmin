import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Toast from './components/Toast';

// Admin Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import FoodsPage from './pages/FoodsPage';
import CategoriesPage from './pages/CategoriesPage';
import PromosPage from './pages/PromosPage';
import RestaurantsPage from './pages/RestaurantsPage';
import CustomersPage from './pages/CustomersPage';
import UsersPage from './pages/UsersPage';
import POSPage from './pages/POSPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import MessagesPage from './pages/MessagesPage';
import StaffManagementPage from './pages/StaffManagementPage';

// Reception Pages & Layout
import ReceptionLayout from './components/reception/layout/ReceptionLayout';
import ReceptionDashboard from './pages/reception/Dashboard';
import ReceptionNewOrder from './pages/reception/NewOrder';
import ReceptionOrders from './pages/reception/Orders';
import ReceptionOrderDetails from './pages/reception/OrderDetails';
import ReceptionCustomers from './pages/reception/Customers';
import ReceptionCustomerDetails from './pages/reception/CustomerDetails';
import ReceptionReceipts from './pages/reception/Receipts';
import ReceptionReports from './pages/reception/Reports';
import ReceptionProfile from './pages/reception/Profile';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, role, isAdmin, isReceptionist } = useAuth();

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const hasRole =
      allowedRoles.includes(role) ||
      (allowedRoles.includes('admin') && isAdmin) ||
      (allowedRoles.includes('receptionist') && isReceptionist);

    if (!hasRole) {
      if (isReceptionist) {
        return <Navigate to="/reception/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function RoleRootRedirect() {
  const { isReceptionist } = useAuth();
  if (isReceptionist) {
    return <Navigate to="/reception/dashboard" replace />;
  }
  return <DashboardPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Unified Public Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRootRedirect />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="foods" element={<FoodsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="promos" element={<PromosPage />} />
        <Route path="restaurants" element={<RestaurantsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Reception Protected Routes */}
      <Route
        path="/reception"
        element={
          <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
            <ReceptionLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/reception/dashboard" replace />} />
        <Route path="dashboard" element={<ReceptionDashboard />} />
        <Route path="new-order" element={<ReceptionNewOrder />} />
        <Route path="pos" element={<ReceptionNewOrder />} />
        <Route path="orders" element={<ReceptionOrders />} />
        <Route path="orders/:orderId" element={<ReceptionOrderDetails />} />
        <Route path="customers" element={<ReceptionCustomers />} />
        <Route path="customers/:customerId" element={<ReceptionCustomerDetails />} />
        <Route path="receipts" element={<ReceptionReceipts />} />
        <Route path="reports" element={<ReceptionReports />} />
        <Route path="profile" element={<ReceptionProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toast />
      </BrowserRouter>
    </AuthProvider>
  );
}
