import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

const DashboardView = lazy(() => import('../DashboardView'));
const CustomersView = lazy(() => import('../CustomersView'));
const InventoryView = lazy(() => import('../InventoryView'));
const EstimatesView = lazy(() => import('../EstimatesView'));
const JobsView = lazy(() => import('../JobsView'));
const ExpensesView = lazy(() => import('../ExpensesView'));
const ApprovalsView = lazy(() => import('../ApprovalsView'));
const ReportsView = lazy(() => import('../ReportsView'));
const InvestorView = lazy(() => import('../InvestorView'));
const AdminUsersView = lazy(() => import('../AdminUsersView'));

export default function GarageRoutes({
  user,
  defaultPath,
  canSee,
  goToTab,
  stats,
  products,
  customers,
  estimates,
  jobs,
  expenses,
  investors,
  technicians,
  approvals,
  handlers,
}) {
  const {
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleAddCustomer,
    handleEditCustomer,
    handleDeleteCustomer,
    handleAddCustomerCar,
    handleCreateEstimate,
    handleUpdateEstimate,
    handleDeleteEstimate,
    handleConvertToJob,
    handleUpdateJobStatus,
    handleDeleteJob,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleAddInvestor,
    handleUpdateInvestor,
    handleDeleteInvestor,
    handleAddInvestorCar,
    handleUpdateInvestorCar,
    handleDeleteInvestorCar,
    handleSellInvestorCar,
    handleDeleteSoldItem,
    handleResolveApproval,
    handleAddTechnician,
    handleDeleteTechnician,
  } = handlers;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} tab="dashboard">
            <DashboardView
              stats={stats}
              jobs={jobs}
              products={products}
              onCreateEstimateClick={() => canSee('estimates') && goToTab('estimates')}
              onViewJobDetail={() => canSee('jobs') && goToTab('jobs')}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute user={user} tab="inventory">
            <InventoryView
              user={user}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute user={user} tab="customers">
            <CustomersView
              customers={customers}
              user={user}
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onAddCustomerCar={handleAddCustomerCar}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates"
        element={
          <ProtectedRoute user={user} tab="estimates">
            <EstimatesView
              estimates={estimates}
              products={products}
              customers={customers}
              technicians={technicians}
              user={user}
              onCreateEstimate={handleCreateEstimate}
              onUpdateEstimate={handleUpdateEstimate}
              onDeleteEstimate={handleDeleteEstimate}
              onConvertToJob={handleConvertToJob}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute user={user} tab="jobs">
            <JobsView
              jobs={jobs}
              technicians={technicians}
              user={user}
              onUpdateJob={handleUpdateJobStatus}
              onDeleteJob={handleDeleteJob}
              onAddTechnician={handleAddTechnician}
              onDeleteTechnician={handleDeleteTechnician}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute user={user} tab="expenses">
            <ExpensesView
              expenses={expenses}
              user={user}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investor"
        element={
          <ProtectedRoute user={user} tab="investor">
            <InvestorView
              investors={investors}
              products={products}
              user={user}
              onAddInvestor={handleAddInvestor}
              onUpdateInvestor={handleUpdateInvestor}
              onDeleteInvestor={handleDeleteInvestor}
              onAddInvestorCar={handleAddInvestorCar}
              onUpdateInvestorCar={handleUpdateInvestorCar}
              onDeleteInvestorCar={handleDeleteInvestorCar}
              onSellInvestorCar={handleSellInvestorCar}
              onDeleteSoldItem={handleDeleteSoldItem}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute user={user} tab="reports">
            <ReportsView products={products} jobs={jobs} customers={customers} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute user={user} tab="approvals">
            <ApprovalsView
              approvals={approvals}
              userRole={user.role}
              onResolveApproval={handleResolveApproval}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute user={user} tab="admin-users">
            <AdminUsersView currentUser={user} investors={investors} />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Navigate to={defaultPath} replace />} />
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
}
