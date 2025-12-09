-- Function to create order notifications
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- On insert, create "Order Placed" notification
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, order_id, title, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Order Placed',
      'Your order has been placed successfully!'
    );
  END IF;

  -- On update, create status change notifications
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'preparing' THEN
      INSERT INTO public.notifications (user_id, order_id, title, message)
      VALUES (
        NEW.user_id,
        NEW.id,
        'Order Preparing',
        'Your order is being prepared! Queue #' || COALESCE(NEW.queue_number::text, '—')
      );
    ELSIF NEW.status = 'ready' THEN
      INSERT INTO public.notifications (user_id, order_id, title, message)
      VALUES (
        NEW.user_id,
        NEW.id,
        'Order Ready',
        'Your order is ready for pickup! Queue #' || COALESCE(NEW.queue_number::text, '—')
      );
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, order_id, title, message)
      VALUES (
        NEW.user_id,
        NEW.id,
        'Order Completed',
        'Order completed. Thank you!'
      );
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, order_id, title, message)
      VALUES (
        NEW.user_id,
        NEW.id,
        'Order Cancelled',
        'Your order has been cancelled.'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for order notifications
DROP TRIGGER IF EXISTS on_order_change ON public.orders;
CREATE TRIGGER on_order_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_notification();