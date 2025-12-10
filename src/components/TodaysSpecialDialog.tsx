import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

const getImageUrl = (name: string | null) => {
  if (!name) return "/placeholder.svg";

  const lower = name.toLowerCase();

  if (lower.includes("chole")) return "/foods/chole bhature.webp";
  if (lower.includes("cold") && lower.includes("coffee")) return "/foods/cold coffee.jpg";
  if (lower.includes("coffee")) return "/foods/coffee2.avif";
  if (lower.includes("fries")) return "/foods/french fries.jpg";
  if (lower.includes("dosa")) return "/foods/masala dosa.jpg";
  if (lower.includes("paneer")) return "/foods/paneer tikka.jpg";
  if (lower.includes("samosa")) return "/foods/samosa.jpg";
  if (lower.includes("burger")) return "/foods/veg burger.jpg";

  return "/placeholder.svg";
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

interface TodaysSpecialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: MenuItem) => void;
}

export const TodaysSpecialDialog = ({ open, onOpenChange, onAddToCart }: TodaysSpecialDialogProps) => {
  const [specialItems, setSpecialItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSpecialItems();
    }
  }, [open]);

  const fetchSpecialItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .limit(4);

      if (error) throw error;
      setSpecialItems(data || []);
    } catch (error) {
      toast.error("Failed to load special items");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    onAddToCart(item);
    toast.success(`${item.name} added to cart`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-special" />
            Today's Special
          </DialogTitle>
          <DialogDescription>
            Check out our handpicked special items for today!
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">Loading specials...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {specialItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-glow transition-smooth">
                <div className="h-40 bg-gradient-card flex items-center justify-center relative">

                  {/* ✅ FIXED, STABLE AI IMAGE */}
                  <img
  src={getImageUrl(item.name)}
  alt={item.name}
  className="w-full h-40 object-cover rounded-t-xl"
/>


                  <Badge className="absolute top-2 right-2 bg-special text-special-foreground">
                    Special
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{item.preparation_time} mins</span>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center pt-0">
                  <span className="text-xl font-bold text-special">₹{item.price}</span>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="bg-special hover:bg-special/90 text-special-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
