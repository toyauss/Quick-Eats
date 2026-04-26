import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  eta_minutes: number;
  queue_number: number;
  notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  order_items: Array<{
    quantity: number;
    menu_items: {
      name: string;
    };
  }>;
}

const CanteenDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles (full_name, email),
          order_items (
            quantity,
            menu_items (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "preparing" | "ready" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error: any) {
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "preparing":
        return "bg-blue-500";
      case "ready":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "preparing":
        return <Package className="h-4 w-4" />;
      case "ready":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter((o) => o.status === "completed");

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-glow transition-smooth">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{order.profiles?.full_name || "Customer"}</CardTitle>
            <CardDescription className="text-sm">{order.profiles?.email}</CardDescription>
          </div>
          <Badge className={getStatusColor(order.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(order.status)}
              {order.status}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {order.order_items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.menu_items?.name}</span>
              <span className="text-muted-foreground">x{item.quantity}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="text-sm">
            <span className="font-semibold">Notes: </span>
            <span className="text-muted-foreground">{order.notes}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">₹{order.total_amount}</div>
            <div className="text-xs text-muted-foreground">
              {order.payment_method === "online" ? "Paid Online" : "Pay at Counter"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">ETA: {order.eta_minutes} mins</div>
            <div className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {order.status === "pending" && (
            <Button
              onClick={() => updateOrderStatus(order.id, "preparing")}
              className="flex-1 bg-gradient-hero"
            >
              Start Preparing
            </Button>
          )}
          {order.status === "preparing" && (
            <Button
              onClick={() => updateOrderStatus(order.id, "ready")}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Mark Ready
            </Button>
          )}
          {order.status === "ready" && (
            <Button
              onClick={() => updateOrderStatus(order.id, "completed")}
              className="flex-1"
            >
              Complete Order
            </Button>
          )}
          {(order.status === "pending" || order.status === "preparing") && (
            <Button
              variant="destructive"
              onClick={() => updateOrderStatus(order.id, "cancelled")}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Order Management
          </h1>
          <p className="text-muted-foreground">View and manage all incoming orders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{pendingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Preparing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{preparingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{readyOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{completedOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading orders...</div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
              <TabsTrigger value="preparing">Preparing ({preparingOrders.length})</TabsTrigger>
              <TabsTrigger value="ready">Ready ({readyOrders.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-8">
                    No pending orders
                  </p>
                ) : (
                  pendingOrders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="preparing" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preparingOrders.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-8">
                    No orders being prepared
                  </p>
                ) : (
                  preparingOrders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="ready" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-8">
                    No orders ready for pickup
                  </p>
                ) : (
                  readyOrders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-8">
                    No completed orders
                  </p>
                ) : (
                  completedOrders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default CanteenDashboard;
