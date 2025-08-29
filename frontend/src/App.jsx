import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import UserDashboard from './pages/dashboards/UserDashboard';

// Admin pages
import OwnerList from './pages/owners/OwnerList';
import OwnerDetail from './pages/owners/OwnerDetail';
import OwnerEdit from './pages/owners/OwnerEdit';
import CategoryManagement from './pages/admin/CategoryManagement';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import OwnerRequirements from './pages/admin/OwnerRequirements';
import OwnerRequests from './pages/admin/OwnerRequests';
import HeldPayments from './pages/admin/HeldPayments';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPaymentDetail from './pages/admin/AdminPaymentDetail';
import ReportDetail from './pages/admin/ReportDetail';
import DeliveryConfirmation from "./pages/bookings/DeliveryConfirmation";
import OwnerDeliveryConfirmation from "./pages/owner/OwnerDeliveryConfirmation";

// Owner pages
import OwnerRequestForm from './pages/owner/OwnerRequestForm';
import RentalItemForm from './pages/owner/RentalItemForm';
import RentalItemList from './pages/owner/RentalItemList';
import RentalItemDetail from './pages/owner/RentalItemDetail';

import RenterInputFieldForm from './pages/owner/RenterInputFieldForm';
import CategorySelection from './pages/rental/CategorySelection';
import CategoryItems from './pages/rental/CategoryItems';
import ItemDetail from './pages/rental/ItemDetail';
import ItemRequirements from './pages/rental/ItemRequirements';

// Booking pages
import BookingList from './pages/bookings/BookingList';
import BookingDetail from './pages/bookings/BookingDetail';
import BookingForm from './pages/bookings/BookingForm';
import OwnerWaitingPage from './pages/bookings/OwnerWaitingPage';
import BookingAcceptReject from './pages/owner/BookingAcceptReject';

// Complaint pages
import ComplaintList from './pages/complaints/ComplaintList';
import ComplaintForm from './pages/complaints/ComplaintForm';
import ComplaintDetail from './pages/complaints/ComplaintDetail';
import ComplaintEdit from './pages/complaints/ComplaintEdit';
import ComplaintsComingSoon from './pages/complaints/ComplaintsComingSoon';

// Payment pages
import PaymentList from './pages/payments/PaymentList';
import PaymentDetail from './pages/payments/PaymentDetail';
import PaymentForm from './components/PaymentForm';
import PaymentStatus from './components/PaymentStatus';
import PaymentCompletion from './pages/payments/PaymentCompletion';

// Notification pages
import NotificationCenter from './pages/notifications/NotificationCenter';
import NotificationsComingSoon from './pages/notifications/NotificationsComingSoon';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/owner" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <OwnerDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <UserDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route path="/admin/owners" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <OwnerList />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/owners/new" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <OwnerEdit />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/owners/:id" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <OwnerDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/owners/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <OwnerEdit />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/reports/:reportType" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <ReportDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/categories" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <CategoryManagement />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/reports" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/owner-requirements" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <OwnerRequirements />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/owner-requests" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <OwnerRequests />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/held-payments" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <HeldPayments />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/payments" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminPayments />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/payments/:id" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminPaymentDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/reports" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/reports/:reportType" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <ReportDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Owner routes */}
                <Route path="/owner/request" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <OwnerRequestForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/owner/rental-items" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <RentalItemList />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/owner/rental-items/new" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <RentalItemForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/owner/rental-items/:id/edit" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <RentalItemForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/owner/rental-items/:id" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <RentalItemDetail />
                    </Layout>
                  </ProtectedRoute>
                } />



                <Route path="/owner/rental-items/:itemId/renter-fields/new" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <RenterInputFieldForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/owner/rental-items/:itemId/renter-fields/:fieldId/edit" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <RenterInputFieldForm />
                    </Layout>
                  </ProtectedRoute>
                } />



                {/* Category Selection and Rental Browsing */}
                <Route path="/browse" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <CategorySelection />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Category Items */}
                <Route path="/rental-items/category/:categoryId" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <CategoryItems />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Item Detail */}
                <Route path="/rental-items/detail/:id" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <ItemDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Item Requirements */}
                <Route path="/rental-items/detail/:id/requirements" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <ItemRequirements />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Booking routes */}
                <Route path="/bookings" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <BookingList />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/bookings/new" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <BookingForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/bookings/:id" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <BookingDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/bookings/:id/edit" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <BookingForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Owner Waiting Route */}
                <Route path="/owner-waiting" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <OwnerWaitingPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Complaint routes */}
                <Route path="/complaints" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <ComplaintsComingSoon />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/complaints/new" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <ComplaintsComingSoon />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/complaints/:id" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <ComplaintsComingSoon />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/complaints/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <ComplaintsComingSoon />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Payment routes */}
                <Route path="/payments" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <PaymentList />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/payment" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <PaymentForm />
                  </ProtectedRoute>
                } />

                <Route path="/payments/:id" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <PaymentDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/payments/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <PaymentForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Payment Status Route */}
                <Route path="/payments/status/:bookingId" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <PaymentStatus />
                  </ProtectedRoute>
                } />

                {/* Payment Completion Route */}
                <Route path="/payment/complete" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <PaymentCompletion />
                  </ProtectedRoute>
                } />

                {/* Payment Completion Route */}
                <Route path="/payment-completion" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <PaymentCompletion />
                  </ProtectedRoute>
                } />

                {/* User Routes */}
                <Route path="/my-bookings" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <BookingList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/delivery-confirmation/:bookingId" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Layout>
                      <DeliveryConfirmation />
                    </Layout>
                  </ProtectedRoute>
                } />


                {/* Notification routes */}
                <Route path="/notifications" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'user']}>
                    <Layout>
                      <NotificationsComingSoon />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Owner Routes */}
                <Route path="/owner/dashboard" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <OwnerDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/owner/bookings" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <BookingList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/owner/bookings/:bookingId" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <BookingDetail />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/owner/bookings/:bookingId/accept" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <BookingAcceptReject action="accept" />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/owner/bookings/:bookingId/reject" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <BookingAcceptReject action="reject" />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/owner/delivery-confirmation/:bookingId" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Layout>
                      <OwnerDeliveryConfirmation />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Catch all route - redirect to appropriate dashboard */}
                <Route path="*" element={
                  <Navigate to="/dashboard" replace />
                } />
              </Routes>
            </Router>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;