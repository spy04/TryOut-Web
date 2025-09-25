import React, { useState, useEffect } from "react";
import { verifyOtp, resendOtp } from "../api/api"; // Ensure to import resendOtp
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifyOtp({ setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); // Timer for resend
  
  const handleVerify = async () => {
    setLoading(true);
    setError("");
    const otpCode = otp.join(""); // Combine OTP fields to one string
    try {
      const data = await verifyOtp(email, otpCode);
      console.log("Data setelah verifikasi OTP:", data);
      if (data.access) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        setUser(data.user);
        const token = localStorage.getItem("token");
        if (token) {
          console.log("Token berhasil disimpan, menuju dashboard...");
          navigate("/dashboard_user", { replace: true });
        } else {
          setError("Token tidak valid, coba lagi.");
        }
      } else {
        setError("OTP salah, coba lagi");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Verifikasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    try {
      await resendOtp(email);
      setResendTimer(5 * 60); // 5 minutes timer in seconds
      localStorage.setItem("resendTimer", 5 * 60); // Save timer to localStorage
    } catch (err) {
      setError("Gagal mengirim OTP, coba lagi.");
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    // Initialize resendTimer from localStorage on page load
    const savedTimer = parseInt(localStorage.getItem("resendTimer"), 10);
    if (savedTimer > 0) {
      setResendTimer(savedTimer);
    }

    // If resendTimer is still active, start countdown
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          const newTimer = prev - 1;
          if (newTimer <= 0) {
            localStorage.removeItem("resendTimer"); // Clear saved timer when it finishes
            clearInterval(timer);
          } else {
            localStorage.setItem("resendTimer", newTimer); // Save the updated timer to localStorage
          }
          return newTimer;
        });
      }, 1000);
      return () => clearInterval(timer); // Cleanup the interval on unmount
    }
  }, [resendTimer]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow numbers
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (index < 5 && value) {
        document.getElementById(`otp-${index + 1}`).focus(); // Auto-focus the next input
      }
    }
  };

  const handlePaste = (e) => {
    const pastedValue = e.clipboardData.getData("text").slice(0, 6); // Only allow up to 6 characters
    const newOtp = pastedValue.split("").map(char => char || "");
    setOtp(newOtp);
  };

  return (
    <div style={{ height: "100vh", backgroundColor: "#152D64", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", color: "white", textAlign: "center", boxSizing: "border-box" }}>
      <div style={{ height: "auto", backgroundColor: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", color: "black", textAlign: "center", boxSizing: "border-box" }}>
        <h2>Verifikasi OTP</h2>
        <p>Masukkan kode OTP yang dikirim ke {email}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          {otp.map((value, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={value}
              onChange={(e) => handleOtpChange(e, index)}
              onPaste={handlePaste}
              maxLength={1}
              style={{
                width: "40px",
                height: "40px",
                textAlign: "center",
                fontSize: "18px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
          ))}
        </div>
        <button onClick={handleVerify} disabled={loading} style={{width: "20vh", maxWidth: "350px", padding: "12px", marginTop: "20px", backgroundColor: "#152D64", color: "white", border: "none", borderRadius: "5px", fontSize: "16px", cursor: "pointer",}}>
          {loading ? "Loading..." : "Verifikasi"}
        </button>
        <p>
          Belum mendapatkan OTP?{" "}
          <span
            onClick={handleResendOtp}
            disabled={resendLoading || resendTimer > 0}
            style={{ padding: "10px 20px", color: resendTimer > 0 ? "#ccc" : "#007bff", cursor: resendTimer > 0 ? "not-allowed" : "pointer", pointerEvents: resendTimer > 0 ? "none" : "auto", }}
          >
            {resendLoading
              ? "Mengirim OTP..."
              : resendTimer > 0
              ? `Kirim ulang (${formatTime(resendTimer)})`
              : "Kirim Ulang OTP"}
          </span>
        </p>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
