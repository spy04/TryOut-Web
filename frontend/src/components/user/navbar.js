import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ isNavbarOpen, toggleMenu }) {
  const location = useLocation(); // Mengambil URL saat ini
  const [isMobile, setIsMobile] = useState(false); // Untuk mengontrol tampilan mobile

  // Menjalankan efek untuk memeriksa ukuran layar dan menetapkan status mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobile(true); // Jika ukuran layar lebih kecil dari 768px
      } else {
        setIsMobile(false); // Jika ukuran layar lebih besar dari 768px
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Memanggil sekali saat komponen pertama kali dimuat

    return () => {
      window.removeEventListener("resize", handleResize); // Membersihkan event listener saat komponen di-unmount
    };
  }, []); // Hanya dijalankan sekali saat komponen pertama kali dimuat

  return (
    <div>
      {/* Sidebar */}
      <div
        style={{
          height: "100%",
          width: isNavbarOpen ? "20%" : "5%", // Ukuran sidebar besar atau kecil
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "#FFFFFF",
          overflowX: "hidden",
          paddingTop: "60px",
          transition: "0.5s",
          borderRadius: "0 10px 0 10px",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)", // Optional: untuk menambahkan bayangan di sisi kiri
        }}
      >
        {/* Close button */}
        <a
          style={{
            position: "absolute",
            top: "15px",
            right: "25px",
            fontSize: "36px",
            color: "#696969",
            cursor: "pointer",
          }}
          onClick={toggleMenu} // Menambahkan fungsi untuk toggle sidebar
        >
          &times;
        </a>
        <div style={{ width: "50%", padding: "10px" }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              padding: "10px",
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>

        {/* Sidebar menu */}
        <ul style={{ listStyleType: "none", padding: "0" }}>
          <li style={{ padding: "8px", textAlign: "left" }}>
            <Link
              to="/"
              style={location.pathname === "/dashboard_user" ? activeLinkStyle : linkStyle}  // Menandai link aktif
            >
              <i className={`fas fa-home ${location.pathname === "/" ? "active-icon" : ""}`} />
              <span style={{ display: isNavbarOpen ? "inline" : "none", padding:"10px" }}>Dashboard</span>
            </Link>
          </li>
          <li style={{ padding: "8px", textAlign: "left" }}>
            <Link
              to="/tryouts"
              style={location.pathname === "/tryouts" ? activeLinkStyle : linkStyle}  // Menandai link aktif
            >
              <i className="fas fa-pen-alt" />
              <span style={{ display: isNavbarOpen ? "inline" : "none", padding:"10px" }}>Tryouts</span>
            </Link>
          </li>
          <li style={{ padding: "8px", textAlign: "left" }}>
            <Link
              to="/practice"
              style={location.pathname === "/practice" ? activeLinkStyle : linkStyle}  // Menandai link aktif
            >
              <i className="fas fa-chalkboard-teacher" />
              <span style={{ display: isNavbarOpen ? "inline" : "none", padding:"10px" }}>Practice</span>
            </Link>
          </li>
          <li style={{ padding: "8px", textAlign: "left" }}>
            <Link
              to="/about"
              style={location.pathname === "/about" ? activeLinkStyle : linkStyle}  // Menandai link aktif
            >
              <i className="fas fa-info-circle" />
              <span style={{ display: isNavbarOpen ? "inline" : "none", padding:"10px" }}>About</span>
            </Link>
          </li>
          <li style={{ padding: "8px", textAlign: "left" }}>
            <Link
              to="/events"
              style={location.pathname === "/events" ? activeLinkStyle : linkStyle}  // Menandai link aktif
            >
              <i className="fas fa-calendar-alt" />
              <span style={{ display: isNavbarOpen ? "inline" : "none", padding:"10px" }}>Event</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Hamburger Menu (for mobile view) */}
      {isMobile && (
        <div
          style={{
            fontSize: "30px",
            color: "#111",
            cursor: "pointer",
            marginTop: "10px",
            paddingLeft: "10px",
          }}
          onClick={toggleMenu} // Menambahkan fungsi toggle untuk sidebar
        >
          ☰
        </div>
      )}
    </div>
  );
}

// Link style
const linkStyle = {
  color: "#696969",
  padding: "10px 15px",
  textDecoration: "none",
  display: "block",
  fontSize: "18px",
  transition: "0.3s",
};

// Style untuk link yang aktif (Dashboard)
const activeLinkStyle = {
  color: "#fff",
  backgroundColor: "#152D64",  // Warna biru untuk background aktif
  padding: "10px 15px",
  textDecoration: "none",
  display: "block",
  fontSize: "18px",
  transition: "0.3s",
  borderRadius: "0 20px 20px 0",  // Rounded only on the right side (top-right and bottom-right)
};

