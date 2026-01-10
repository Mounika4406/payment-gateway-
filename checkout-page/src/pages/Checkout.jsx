import { useEffect, useState } from "react";

export default function Checkout() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");

  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState("upi");

  const [vpa, setVpa] = useState("");
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [status, setStatus] = useState("idle");
  const [paymentId, setPaymentId] = useState("");
  const [error, setError] = useState("");

  /* =====================
     LOAD ORDER (PUBLIC)
  ===================== */
  useEffect(() => {
    if (!orderId) {
      setError("Order ID missing");
      return;
    }

    fetch(`http://localhost:8000/api/v1/orders/${orderId}/public`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error();
        setOrder(data);
      })
      .catch(() => setError("Order not found"));
  }, [orderId]);

  /* =====================
     CREATE PAYMENT
  ===================== */
  async function pay() {
    setStatus("processing");
    setError("");

    const payload =
      method === "upi"
        ? {
            order_id: orderId,
            method: "upi",
            vpa,
          }
        : {
            order_id: orderId,
            method: "card",
            card,
          };

    try {
      const res = await fetch("http://localhost:8000/checkout/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.id) throw new Error();

      setPaymentId(data.id);
      pollStatus(data.id);
    } catch {
      setStatus("failed");
      setError("Payment request failed");
    }
  }

  /* =====================
     POLL PAYMENT STATUS
  ===================== */
  function pollStatus(id) {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:8000/checkout/orders/${orderId}`,

        {
          headers: {
            "X-Api-Key": "key_test_abc123",
            "X-Api-Secret": "secret_test_xyz789",
          },
        }
      );

      const data = await res.json();

      if (data.status === "processing") return;

      clearInterval(interval);
      setStatus(data.status);
    }, 1000);
  }

  if (error) return <p>{error}</p>;
  if (!order) return <p>Loading...</p>;

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "40px auto",
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h2>Complete Payment</h2>

      <p>Amount: ₹{(order.amount / 100).toFixed(2)}</p>
      <p>Order ID: {order.id}</p>

      {/* PAYMENT METHOD SWITCH */}
      {status === "idle" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setMethod("upi")}>UPI</button>
            <button
              onClick={() => setMethod("card")}
              style={{ marginLeft: 8 }}
            >
              Card
            </button>
          </div>

          {/* UPI FORM */}
          {method === "upi" && (
            <input
              placeholder="user@bank"
              value={vpa}
              onChange={e => setVpa(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />
          )}

          {/* CARD FORM */}
          {method === "card" && (
            <>
              <input
                placeholder="Card Number"
                onChange={e =>
                  setCard({ ...card, number: e.target.value })
                }
                style={{ width: "100%", marginBottom: 8 }}
              />
              <input
                placeholder="MM/YY"
                onChange={e =>
                  setCard({ ...card, expiry: e.target.value })
                }
                style={{ width: "100%", marginBottom: 8 }}
              />
              <input
                placeholder="CVV"
                onChange={e =>
                  setCard({ ...card, cvv: e.target.value })
                }
                style={{ width: "100%", marginBottom: 8 }}
              />
              <input
                placeholder="Name on Card"
                onChange={e =>
                  setCard({ ...card, name: e.target.value })
                }
                style={{ width: "100%", marginBottom: 10 }}
              />
            </>
          )}

          <button onClick={pay}>
            Pay ₹{(order.amount / 100).toFixed(2)}
          </button>
        </>
      )}

      {status === "processing" && <p>Processing payment...</p>}
      {status === "success" && (
        <>
          <h3>Payment Successful 🎉</h3>
          <p>Payment ID: {paymentId}</p>
        </>
      )}
      {status === "failed" && <p>Payment Failed ❌</p>}
    </div>
  );
}
