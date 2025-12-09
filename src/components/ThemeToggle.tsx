// src/components/ThemeToggle.tsx

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
// Use the custom context hook
import { useTheme } from "@/contexts/ThemeContext" 
import { cn } from "@/lib/utils" // Utility function for merging class names

interface ThemeToggleProps {
  className?: string; 
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  // Destructure the actual theme and the correct function (toggleTheme) from your context
  const { theme, toggleTheme } = useTheme()

  // The handleToggle logic is now simplified because toggleTheme does the work
  const handleToggle = () => {
    toggleTheme();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle} // Calls the function that flips the theme
      className={cn( 
        // Default subtle style for the Navbar
        "hover:bg-accent-foreground/10 text-muted-foreground", 
        className // Applies the custom class (e.g., from Navbar.tsx)
      )}
    >
      {/* Sun icon: visible when theme is "light" */}
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      {/* Moon icon: visible when theme is "dark" */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}