import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Utensils, Clock, ShoppingCart, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate(userRole === "canteen_worker" ? "/canteen" : "/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-hero rounded-3xl shadow-glow animate-pulse">
              <Utensils className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Canteen Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your campus dining experience with our modern ordering and management platform
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-hero hover:shadow-glow text-lg px-8 py-6 transition-smooth"
          >
            Get Started
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <div className="text-center p-6 rounded-2xl bg-card border border-border/50 hover:shadow-glow transition-smooth">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Easy Ordering</h3>
            <p className="text-muted-foreground">
              Browse menu, add to cart, and place orders in seconds
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card border border-border/50 hover:shadow-glow transition-smooth">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Real-Time Updates</h3>
            <p className="text-muted-foreground">
              Track your order status and get notified when it's ready
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card border border-border/50 hover:shadow-glow transition-smooth">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Fast Service</h3>
            <p className="text-muted-foreground">
              Skip the queue with scheduled pickups and efficient management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
