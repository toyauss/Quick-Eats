import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import QueueDisplay from "@/components/QueueDisplay";
import { TodaysSpecialDialog } from "@/components/TodaysSpecialDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Minus, ShoppingCart, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { useNotification } from "../contexts/NotificationContext";

// Utility function to simulate image placeholder
const getImageUrl = (name: string | null) => {
  if (!name) return "https://via.placeholder.com/150x100?text=Food+Item";
  // A simple way to get different placeholders based on the item name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['a1887f', '4db6ac', '7986cb', 'ffb74d'];
  const color = colors[hash % colors.length];
  return `https://via.placeholder.com/150x100/${color}/FFFFFF?text=${name.split(' ')[0]}`;
};


interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  preparation_time: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: string;
  queue_number: number;
  eta_minutes: number;
  status: string;
}

interface AISuggestion {
  name: string;
  reason: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "counter">(
    "counter"
  );
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isSpecialOpen, setIsSpecialOpen] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
    fetchActiveOrder();
    fetchAISuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("order-updates");

    const handleUpdate = () => {
      fetchActiveOrder().catch(console.error);
    };

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        handleUpdate
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // console.warn("Failed to remove supabase channel", e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("category");
      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      console.error("fetchMenuItems error:", err);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrder = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "preparing", "ready"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveOrder(data as Order | null);
    } catch (err) {
      console.error("fetchActiveOrder error:", err);
    }
  };

  const fetchAISuggestions = async () => {
    if (!user) {
      setAISuggestions([
        { name: "Cheese Burger", reason: "Popular choice today" },
        { name: "Veg Sandwich", reason: "Light & filling" },
        { name: "French Fries", reason: "Quick snack" },
      ]);
      return;
    }

    try {
      const url = `${window.location.origin}/api/suggest-orders`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const json = await res.json();
      const suggestions = json.suggestions || [];

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        setAISuggestions([
          { name: "Cheese Burger", reason: "Popular choice today" },
          { name: "Veg Sandwich", reason: "Light & filling" },
          { name: "French Fries", reason: "Quick snack" },
        ]);
      } else {
        setAISuggestions(suggestions);
      }
    } catch (err) {
      console.error("Failed to fetch AI suggestions", err);
      setAISuggestions([
        { name: "Cheese Burger", reason: "Popular choice today" },
        { name: "Veg Sandwich", reason: "Light & filling" },
        { name: "French Fries", reason: "Quick snack" },
      ]);
    }
  };

  const categories = ["all", ...Array.from(new Set(menuItems.map((item) => item.category)))];
  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
    addNotification(`${item.name} added to cart!`, "success");
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPreparationTime = cart.length ? Math.max(...cart.map((item) => item.preparation_time)) : 0;

  const handleCheckout = async () => {
    if (!user || cart.length === 0) return;

    try {
      let finalScheduledTime = null;
      if (scheduledTime) {
        const today = new Date().toISOString().split('T')[0];
        const dateTimeString = `${today}T${scheduledTime}:00`;
        finalScheduledTime = new Date(dateTimeString).toISOString();
      }

      const { data: lastOrder } = await supabase
        .from("orders")
        .select("queue_number")
        .order("queue_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextQueueNumber = ((lastOrder as { queue_number: number })?.queue_number || 0) + 1;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          payment_method: paymentMethod,
          payment_status: "pending",
          scheduled_time: finalScheduledTime,
          eta_minutes: totalPreparationTime + 5,
          notes: notes || null,
          queue_number: nextQueueNumber,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: (order as any).id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      setCart([]);
      setIsCartOpen(false);
      setNotes("");
      setScheduledTime("");

      if (paymentMethod === "online") {
        toast.info("Redirecting to UPI payment...");
        navigate(`/checkout?orderId=${(order as any).id}&amount=${cartTotal.toFixed(2)}`);
      } else {
        toast.success("Order placed successfully (Pay at Counter)!");
        addNotification("Order placed successfully!", "success");
      }

      fetchActiveOrder();
    } catch (error: any) {
      console.error("Order Error:", error);
      toast.error("Failed to place order: " + (error.message || 'Unknown error'));
      addNotification("Failed to place order", "error");
    }
  };

  // --- Food Card Component (Internal to Dashboard) ---
  const FoodCard: React.FC<{ item: MenuItem; onAddToCart: (item: MenuItem) => void }> = ({ item, onAddToCart }) => (
    <Card className="flex flex-col bg-gray-800 text-white border-gray-700 shadow-lg dark:bg-gray-800">
      <div className="relative h-24 overflow-hidden rounded-t-lg">
        <img
          src={item.image_url || getImageUrl(item.name)}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 font-bold">
          {item.category.toUpperCase()}
        </Badge>
      </div>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-lg font-semibold truncate text-white">
          {item.name}
        </CardTitle>
        <CardDescription className="text-xs text-gray-400 h-8 line-clamp-2">
          {item.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center p-3 pt-0">
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-[#DC2829]"> {/* Red Price */}
            ₹{item.price.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.preparation_time} min
          </span>
        </div>
        <Button
          onClick={() => onAddToCart(item)}
          className="bg-[#DC2829] hover:bg-red-700 text-white rounded-full w-10 h-10 p-0 shadow-md"
          title="Add to Cart"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </CardContent>
    </Card>
  );
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground dark:text-gray-100">
      <Navbar
        cartItemsCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        showCart
        onCartClick={() => setIsCartOpen(true)}
      />

      <TodaysSpecialDialog open={isSpecialOpen} onOpenChange={setIsSpecialOpen} onAddToCart={addToCart} />

      {/* Adjusted pt-[70px] to ensure content is not hidden behind the narrower h-14 navbar */}
      <main className="container mx-auto px-4 py-8 pt-[100px]"> 

        {/* Menu heading + Today's Special button */}
        <div className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-[#DC2829]">Menu</h1>
            <p className="text-muted-foreground">Browse and order your favorite items</p>
          </div>
          <Button
            onClick={() => setIsSpecialOpen(true)}
            className="w-45 h-15 rounded-full bg-[#DC2829] text-white text-md font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 text-center leading-tight p-2"
          >
            Today's Special
          </Button>
        </div>

        {/* Queue Display and AI Suggestions Section - Forced 50/50 split on medium screens */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6"> 
          
          {activeOrder && (
            <div className="col-span-1">
              <QueueDisplay queueNumber={activeOrder.queue_number} etaMinutes={activeOrder.eta_minutes} status={activeOrder.status} />
            </div>
          )}

          {/* AI Suggestions card - Always col-span-1 on md screens if an active order exists */}
          <Card className={`col-span-1 bg-gray-800 text-white p-6 shadow-md border-none ${!activeOrder ? 'md:col-span-2' : ''}`}>
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2 text-red-500">
                <span className="text-2xl">🤖</span> AI Recommendations
              </CardTitle>
              <CardDescription className="text-gray-400">Analyzing your preferences...</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-start p-2 bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-200 truncate w-full">{item.name}</span>
                    <span className="text-xs text-red-400 mb-2">{item.reason}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        const menuItem = menuItems.find((m) => m.name === item.name);
                        if (menuItem) addToCart(menuItem);
                      }}
                      className="text-xs h-6 px-3 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Add
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 col-span-full">No AI suggestions yet</p>
              )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Menu Items Grid - Adjusted to sm:grid-cols-3 for 3 cards in a row */}
        {loading ? (
          <p className="text-center text-lg">Loading menu...</p>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredItems.map((item) => (
              <FoodCard key={item.id} item={item} onAddToCart={addToCart} />
            ))}
          </div>
        ) : (
          <p className="text-center text-lg text-muted-foreground">
            No items found in {selectedCategory === 'all' ? 'the menu' : selectedCategory} category.
          </p>
        )}
      </main>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md dark:bg-gray-800 dark:text-gray-100">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-[#DC2829]">Your Cart ({cart.length})</SheetTitle>
            <SheetDescription className="text-gray-400">
              Review your order before checking out.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col justify-between h-[calc(100%-80px)]">
            {cart.length === 0 ? (
              <p className="text-center mt-10 text-lg text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg shadow-sm">
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-sm text-[#DC2829]">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 bg-gray-600 hover:bg-gray-500 text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-6 text-center font-bold text-white">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 bg-gray-600 hover:bg-gray-500 text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 text-red-500 hover:bg-red-900 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <h3 className="text-lg font-bold mt-6 text-white border-t border-gray-600 pt-4">Options</h3>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment" className="text-gray-300">Payment Method</Label>
                  <RadioGroup
                    defaultValue="counter"
                    onValueChange={(value: "online" | "counter") => setPaymentMethod(value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="counter" id="counter" className="text-[#DC2829]" />
                      <Label htmlFor="counter" className="text-gray-200">Pay at Counter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="online" className="text-[#DC2829]" />
                      <Label htmlFor="online" className="text-gray-200">UPI/Online</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-300">Special Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., 'No onion, extra cheese'"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Scheduled Time */}
                <div className="space-y-2">
                  <Label htmlFor="schedule" className="text-gray-300">Schedule Order (Optional)</Label>
                  <input
                    id="schedule"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#DC2829]"
                  />
                  <p className="text-xs text-gray-400">Leave blank for immediate order.</p>
                </div>
              </div>
            )}

            {/* Footer and Checkout Button */}
            <div className="border-t border-gray-700 pt-4 pb-2">
              <div className="flex justify-between font-bold text-xl mb-3">
                <span className="text-white">Total:</span>
                <span className="text-[#DC2829]">₹{cartTotal.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-[#DC2829] hover:bg-red-700 text-white text-lg py-6 font-bold flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StudentDashboard;