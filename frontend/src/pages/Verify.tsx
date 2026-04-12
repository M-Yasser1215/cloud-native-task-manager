import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import type { AuthResponse } from "../types";

type Status = "loading" | "success" | "error";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    api
      .get<AuthResponse>(`/auth/verify?token=${token}`)
      .then(({ data }) => {
        login(data.access_token, data.user);
        setStatus("success");
        setTimeout(() => navigate("/"), 2000);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.response?.data?.detail || "Verification failed. The link may have expired.");
      });
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">◈</div>

          {status === "loading" && (
            <>
              <h1>Verifying...</h1>
              <p>Please wait while we confirm your email.</p>
            </>
          )}

          {status === "success" && (
            <>
              <h1 style={{ color: "var(--accent)" }}>Email verified ✓</h1>
              <p>Your account is active. Redirecting you to your dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <h1>Verification failed</h1>
              <p style={{ color: "var(--red)" }}>{errorMsg}</p>
            </>
          )}
        </div>

        {status === "error" && (
          <p className="auth-switch">
            <Link to="/register">Try registering again</Link> or <Link to="/login">sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
