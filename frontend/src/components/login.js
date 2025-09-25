import { useState } from "react";
import { loginUser } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(false); // State untuk kontrol slide
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(email, password);

      if (data.need_otp) {
        // User belum aktif → redirect ke OTP form
        navigate("/verify-otp", { state: { email: data.email } });
        return;
      }

      // User aktif → redirect ke dashboard
      navigate("/dashboard_user", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    setSlide(true); // Trigger slide
    setTimeout(() => {
      navigate("/register");
    }, 300); // Waktu untuk animasi selesai
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh", // Mengatur agar konten mengisi layar penuh
        margin: 0, // Pastikan tidak ada margin yang menyebabkan scroll
        padding: 0, // Pastikan tidak ada padding yang menyebabkan scroll
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          backgroundColor: "#FFFF",
          width: "100%",
          flexDirection: "row", // Susun kolom secara berdampingan
          alignItems: "stretch", // Memastikan kolom punya tinggi yang sama
          height: "100%", // Pastikan div ini mengisi seluruh tinggi layar
        }}
      >
        {/* Kolom untuk login */}
        <div
          style={{
            flex: 4,
            height: "100vh", // Mengatur tinggi kotak agar memenuhi layar
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center", // Posisikan konten secara vertikal di tengah
            alignItems: "center", // Posisikan konten secara horizontal di tengah
            padding: "20px", // Padding agar isi tidak terlalu mepet
            boxSizing: "border-box", // Agar padding tidak mempengaruhi ukuran total
          }}
        >
          <div></div>
          <h2 style={{ fontSize: "40px" }}>Sign In</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "40vh",
              marginBottom: "20px",
              padding: "10px",
              borderRadius: "2px #ccc",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "40vh",
              marginBottom: "20px",
              padding: "10px",
              borderRadius: "2px #ccc",
            }}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "20vh",
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "#152D64",
              color: "white",
              border: "none",
            }}
          >
            {loading ? "Loading..." : "Login"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

        {/* Kolom untuk message */}
        <div
          style={{
            flex: 6,
            height: "100vh", // Mengatur tinggi kotak agar memenuhi layar
            backgroundColor: "#152D64",
            borderRadius: "45% 0 0 45%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center", // Posisikan konten secara vertikal di tengah
            alignItems: "center", // Posisikan konten secara horizontal di tengah
            padding: "20px", // Padding agar isi tidak terlalu mepet
            color: "white",
            textAlign: "center",
            boxSizing: "border-box", // Agar padding tidak mempengaruhi ukuran total
            transform: slide ? "translateX(-100%)" : "translateX(0)", // Animasi slide ke kiri
            transition: "transform 0.5s ease-in-out",
          }}
        >
          <strong style={{ fontSize: "40px" }}>Hello Friend!</strong>
          <br />
          <div>Daftar sekarang, siap-siap jadi lebih pintar!</div>
          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              marginTop: "20px",
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "transparent",
              borderColor: "red",
              color: "white",
              border: "2px solid white", // Border putih
            }}
          >
            {"Daftar Sekarang"}
          </button>
        </div>
      </div>
    </div>
  );
}
