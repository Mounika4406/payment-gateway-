import { useEffect, useState } from "react";
import { getPayments } from "../api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    amount: 0,
    successRate: 0,
  });

  useEffect(() => {
    getPayments().then((payments) => {
      const total = payments.length;
      const success = payments.filter(p => p.status === "success");
      const amount = success.reduce((s, p) => s + p.amount, 0);
      const successRate = total ? Math.round((success.length / total) * 100) : 0;

      setStats({ total, amount, successRate });
    });
  }, []);

  return (
    <div className="container">
      <h1>Merchant Dashboard</h1>

      <div className="card">
        <p><b>API Key:</b> <span data-test-id="api-key">key_test_abc123</span></p>
        <p><b>API Secret:</b> <span data-test-id="api-secret">secret_test_xyz789</span></p>
      </div>

      <br />

      <div style={{ display: "flex", gap: 20 }}>
        <div className="card" style={{ flex: 1 }}>
          <h3>Total Transactions</h3>
          <div data-test-id="total-transactions">{stats.total}</div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h3>Total Amount</h3>
          <div data-test-id="total-amount">₹{(stats.amount / 100).toFixed(2)}</div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h3>Success Rate</h3>
          <div data-test-id="success-rate">{stats.successRate}%</div>
        </div>
      </div>

      <br />

      <Link to="/dashboard/transactions">View Transactions →</Link>
    </div>
  );
}
