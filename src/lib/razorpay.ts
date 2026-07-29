/**
 * Helper to dynamically load the Razorpay checkout script.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    // If already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

interface PaymentOptions {
  amount: number; // in paise (e.g. 50000 for Rs. 500)
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
}

/**
 * Triggers the Razorpay checkout modal with the provided configurations.
 */
export async function triggerRazorpayPayment({
  amount,
  name,
  description,
  prefill,
  onSuccess,
  onDismiss,
}: PaymentOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Failed to load Razorpay SDK. Please check your network connection.");
  }

  const options = {
    key: "rzp_test_NgwEwXk1hnhpL6",
    amount,
    currency: "INR",
    name,
    description,
    image: "https://vmpatfemtdjqvxandswk.supabase.co/storage/v1/object/public/branding/logo.png", // fallback or dummy logo
    prefill: {
      name: prefill?.name || "",
      email: prefill?.email || "",
      contact: prefill?.contact || "",
    },
    theme: {
      color: "#0f172a", // slate-900 theme color to match Bizkit brand
    },
    handler: function (response: any) {
      if (response.razorpay_payment_id) {
        onSuccess(response.razorpay_payment_id);
      }
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) {
          onDismiss();
        }
      },
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
