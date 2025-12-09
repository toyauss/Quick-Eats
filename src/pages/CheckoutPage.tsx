import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
// --- UI Component Imports for Theming ---
import { Navbar } from "@/components/Navbar"; 
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
// ----------------------------------------
import UpiPaymentButton from "@/components/UpiPaymentButton";
import { toast } from "sonner";
import { useNotification } from "@/contexts/NotificationContext";

const CheckoutPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    // Get order details from URL
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failure'>('pending');
    const [isVerifying, setIsVerifying] = useState(false);
    const [paymentAttempted, setPaymentAttempted] = useState(false);

    // Function to update the Supabase order status
    const updateOrderStatus = useCallback(async (newPaymentStatus: 'completed' | 'failed') => {
        if (!orderId) return;

        // Determine the overall order status after payment
        const newOrderStatus = newPaymentStatus === 'completed' ? 'pending' : 'cancelled'; // 'pending' means awaiting preparation

        const { error } = await supabase
            .from('orders')
            .update({ 
                payment_status: newPaymentStatus,
                status: newOrderStatus
            })
            .eq('id', orderId);

        if (error) {
            console.error("Failed to update order status after payment:", error);
            toast.error(`Order update failed: ${error.message}`);
        }
    }, [orderId]);

    // Handle Mock Verification (Simulates UPI callback)
    const handleVerifyPayment = async () => {
        if (!orderId) return;
        setIsVerifying(true);
        setPaymentAttempted(true);

        // --- MOCK API CALL SIMULATION ---
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        
        // For the hackathon: We assume success unless specified otherwise.
        const success = Math.random() < 0.95; // 95% chance of success

        if (success) {
            setVerificationStatus('success');
            await updateOrderStatus('completed');
            toast.success("Payment successful! Your order is now pending.");
            addNotification("Payment Successful! Order placed.", "success");
            navigate(`/order-history?orderId=${orderId}`); // Redirect to order history or dashboard
        } else {
            setVerificationStatus('failure');
            await updateOrderStatus('failed');
            toast.error("Payment verification failed. Please try again.");
            addNotification("Payment Failed. Please retry.", "error");
        }
        setIsVerifying(false);
    };

    // Ensure parameters are present
    useEffect(() => {
        if (!orderId || !amount) {
            toast.error("Missing order details. Returning to dashboard.");
            navigate('/student-dashboard');
        }
    }, [orderId, amount, navigate]);

    if (!orderId || !amount) {
        return (
            // Apply theme classes for loading state
            <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-gray-100">
                <Navbar showCart={false} />
                <div className="container mx-auto py-12 text-center">Loading or invalid order...</div>
            </div>
        );
    }

    return (
        // Apply theme classes to the main container
        <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-gray-100">
            <Navbar showCart={false} />

            <main className="container mx-auto px-4 py-12 max-w-lg">
                <Card className="shadow-2xl border-primary/50">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-extrabold text-primary">Secure Checkout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <p className="text-lg text-muted-foreground">Order ID:</p>
                            <p className="text-xl font-mono break-words">{orderId}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">Total Amount Due:</p>
                            {/* Display amount, safe to use parseFloat(amount) for display */}
                            <p className="text-5xl font-extrabold text-green-500">₹{parseFloat(amount).toFixed(2)}</p> 
                        </div>

                        {verificationStatus === 'pending' && (
                            <UpiPaymentButton 
                                // 🚨 FIX: Convert amount string to number here
                                amount={parseFloat(amount)}
                                orderId={orderId} description={""}                            />
                        )}

                        {/* Status Alerts */}
                        {verificationStatus === 'success' && (
                            <Alert className="bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-300">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Payment Complete!</AlertTitle>
                                <AlertDescription>Your payment was successfully verified. You're being redirected.</AlertDescription>
                            </Alert>
                        )}

                        {verificationStatus === 'failure' && (
                            <Alert className="bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-300">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Payment Failed</AlertTitle>
                                <AlertDescription>We could not verify your payment. Please try again or choose 'Pay at Counter'.</AlertDescription>
                            </Alert>
                        )}
                        
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        {verificationStatus === 'pending' && (
                            <Button 
                                onClick={handleVerifyPayment} 
                                // Disabled until user clicks UPI button, or while verifying
                                disabled={isVerifying || !paymentAttempted} 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Click AFTER Paying in UPI App (Hackathon Demo)"
                                )}
                            </Button>
                        )}

                        {verificationStatus === 'pending' && (
                             <p className="text-xs text-center text-muted-foreground">
                                1. Click 'Pay with UPI App' above. 2. Complete payment in your UPI app. 3. Return here and click the verification button.
                            </p>
                        )}
                       
                        {verificationStatus !== 'success' && (
                            <Button 
                                variant="link" 
                                className="text-muted-foreground"
                                onClick={() => navigate('/student-dashboard')}
                            >
                                Cancel and return to menu
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
};

export default CheckoutPage;