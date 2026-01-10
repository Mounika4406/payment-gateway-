import { useEffect, useState } from "react";
import { getPayments } from "../api";

export default function Transactions() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    getPayments().then(setPayments);
  }, []);

  return (
    <table data-test-id="transactions-table" border="1">
      <thead>
        <tr>
          <th>Payment ID</th>
          <th>Order ID</th>
          <th>Amount</th>
          <th>Method</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>

      <tbody>
        {payments.map((p) => (
          <tr
            key={p.id}
            data-test-id="transaction-row"
            data-payment-id={p.id}
          >
            <td data-test-id="payment-id">{p.id}</td>
            <td data-test-id="order-id">{p.order_id}</td>
            <td data-test-id="amount">{p.amount}</td>
            <td data-test-id="method">{p.method}</td>
            <td data-test-id="status">{p.status}</td>
            <td data-test-id="created-at">
              {new Date(p.created_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
