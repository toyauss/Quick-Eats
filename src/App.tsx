import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import CanteenDashboard from "./pages/CanteenDashboard";
import OrderHistory from "./pages/OrderHistory";
import NotFound from "./pages/NotFound";
import CheckoutPage from "./pages/CheckoutPage"; // <-- IMPORTED NEW PAGE

const queryClient = new QueryClient();

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === "canteen_worker" ? "/canteen" : "/dashboard"} />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* --- STUDENT ROUTES --- */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                
                {/* 🛒 NEW UPI CHECKOUT ROUTE ADDED HERE */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <CheckoutPage /> 
                    </ProtectedRoute>
                  }
                />
                
                {/* --- CANTEEN WORKER ROUTE --- */}
                <Route
                  path="/canteen"
                  element={
                    <ProtectedRoute requiredRole="canteen_worker">
                      <CanteenDashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;