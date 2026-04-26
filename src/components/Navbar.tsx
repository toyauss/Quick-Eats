import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, History, LogOut, ShoppingCart, Utensils, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import React from "react"; 

interface NavButtonWithBadgeProps {
  icon: LucideIcon;
  count: number;
  onClick: () => void;
  className?: string;
}

const NavButtonWithBadge: React.FC<NavButtonWithBadgeProps> = ({ 
  icon: Icon, 
  count, 
  onClick, 
  className = "hover:bg-accent-foreground/10 text-muted-foreground" 
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`relative ${className}`}
    >
      <Icon className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
          <Badge className="h-4 min-w-4 p-0 px-1 flex items-center justify-center text-xs font-medium bg-red-600 text-white border-red-800">
            {count > 9 ? '9+' : count}
          </Badge>
        </span>
      )}
    </Button>
  );
};

interface NavbarProps {
  cartItemsCount?: number;
  notificationsCount?: number;
  showCart?: boolean;
  onCartClick?: () => void;
  onNotificationsClick?: () => void;
}

export const Navbar = ({
  cartItemsCount = 0,
  notificationsCount = 0,
  showCart = false,
  onCartClick,
  onNotificationsClick,
}: NavbarProps) => {
  const { signOut, userRole } = useAuth();
  const navigate = useNavigate();

  return (
   <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Logo and App Name (QuickEats) - Gap reduced to gap-[2px] */}
        <div className="flex items-center gap-[5px]"> 
          <div className="p-1.5 bg-[#DC2829] rounded-lg w-8 h-8 flex items-center justify-center">
            <Utensils className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-[#DC2829]"> 
            QuickEats
          </span>
        </div>

        {/* Icons section */}
        <div className="flex items-center gap-2"> 
          {userRole === "student" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/history")}
                className="hover:bg-accent-foreground/10 text-muted-foreground" 
              >
                <History className="h-5 w-5" />
              </Button>
              
              <NavButtonWithBadge 
                icon={Bell} 
                count={notificationsCount} 
                onClick={onNotificationsClick || (() => {})} 
                className="hover:bg-accent-foreground/10 text-muted-foreground" 
              />
              
              {showCart && onCartClick && (
                <NavButtonWithBadge 
                  icon={ShoppingCart} 
                  count={cartItemsCount} 
                  onClick={onCartClick} 
                  className="hover:bg-accent-foreground/10 text-muted-foreground" 
                />
              )}
            </>
          )}
          
          {userRole === "canteen_worker" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/canteen/history")}
              className="hover:bg-accent-foreground/10 text-muted-foreground" 
            >
              <History className="h-5 w-5" />
            </Button>
          )}
          
          <ThemeToggle className="hover:bg-accent-foreground/10 text-muted-foreground" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="hover:bg-destructive/10 text-muted-foreground" 
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};