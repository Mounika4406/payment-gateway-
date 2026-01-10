import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Store test credentials
    localStorage.setItem("apiKey", "key_test_abc123");
    localStorage.setItem("apiSecret", "secret_test_xyz789");

    navigate("/dashboard");
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "auto" }}>
        <h2>Merchant Login</h2>

        <form data-test-id="login-form" onSubmit={handleLogin}>
          <input
            data-test-id="email-input"
            type="email"
            placeholder="Email"
            required
          />

          <input
            data-test-id="password-input"
            type="password"
            placeholder="Password"
            required
          />

          <button data-test-id="login-button">Login</button>
        </form>
      </div>
    </div>
  );
}
