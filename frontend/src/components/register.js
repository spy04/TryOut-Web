import { useState } from "react";
import { registerUser } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state
  const [slide, setSlide] = useState(false); // State for slide effect
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state to true
    try {
      const response = await registerUser({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        email,
        password,
      });

      if (response.user_active) {
        navigate("/login");
      } else {
        navigate("/verify-otp", { state: { email } });
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === "user_exists_unverified") {
        navigate("/verify-otp", { state: { email } });
      } else {
        console.error(err.response?.data || err);
        alert("Gagal daftar, cek inputan.");
      }
    } finally {
      setLoading(false); // Set loading state back to false after request completes
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (e.target.value !== password) {
      setError("Password dan Konfirmasi Password tidak cocok!");
    } else {
      setError("");
    }
  };

  const handleLogin = () => {
    setSlide(true);
    setTimeout(() => {
      navigate("/");
    }, 300);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          backgroundColor: "#FFFF",
          width: "100%",
          flexDirection: "row",
          alignItems: "stretch",
          height: "100%",
        }}
      >
        <div
          style={{
            flex: 4,
            height: "100vh",
            backgroundColor: "#152D64",
            borderRadius: "0 15% 15% 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            color: "white",
            textAlign: "center",
            boxSizing: "border-box",
            transform: slide ? "translateX(100%)" : "translateX(0)",
            transition: "transform 0.5s ease-in-out",
          }}
        >
          <strong style={{ fontSize: "40px" }}>Welcome Back!</strong>
          <br />
          <div>Masuk sekarang dan lanjutkan petualangan belajarmu!</div>
          <button
            onClick={handleLogin}
            style={{
              marginTop: "20px",
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "transparent",
              borderColor: "red",
              color: "white",
              border: "2px solid white",
            }}
          >
            Login Sekarang
          </button>
        </div>
        <div
          style={{
            flex: 6,
            height: "100vh",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <h2 style={{ fontSize: "40px" }}>Register</h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "stretch",
              width: "100%",
              margin: "0 auto",
              padding: "40px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                marginBottom: "20px",
                gap:"20px",
                                  boxSizing: "border-box", 

              }}
            >
              <input
                style={{
                  boxSizing: "border-box", 
                  flex: "50%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",backgroundColor: "#efefefff"
                }}
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                style={{
                  flex: "50%",
                  boxSizing: "border-box", 
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  backgroundColor: "#efefefff"
                }}
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <input
              style={{
                width: "100%",
                marginBottom: "20px",
                padding: "10px",
                borderRadius: "5px",
                backgroundColor: "#efefefff",
                border: "1px solid #ccc",
              }}
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <input
              style={{
                width: "100%",
                marginBottom: "20px",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: "#efefefff"
              }}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              style={{
                width: "100%",
                marginBottom: "20px",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: "#efefefff"

              }}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              style={{
                width: "100%",
                marginBottom: "0px",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: "#efefefff"
              }}
              type="password"
              placeholder="Ulangi Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Register Button with Spinner Animation */}
            <button
              type="button"
              onClick={handleRegister}
              style={{
                width: "20vh",
                maxWidth: "350px",
                padding: "12px",
                marginTop: "20px",
                
                backgroundColor: "#152D64",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
              }}
              disabled={loading}
            >
              {loading ? (
                <div
                  style={{
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #152D64",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    animation: "spin linear infinite",
                  }}
                ></div>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
