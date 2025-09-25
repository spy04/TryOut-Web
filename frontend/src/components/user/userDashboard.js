import { useEffect, useState } from "react";
import { fetchTryouts, fetchTryoutResult, fetchUser } from "../../api/api";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar"; // Import Navbar component

export default function DashboardUser() {
  const navigate = useNavigate();
  const [results, setResults] = useState({});
  const [tryouts, setTryouts] = useState([]);
  const [user, setUser] = useState(null); // State to store user data
  const [isNavbarOpen, setIsNavbarOpen] = useState(true); // State to control navbar toggle

  useEffect(() => {
    const load = async () => {
      const res = await fetchTryouts();
      setTryouts(res.data);

      // Ambil result tiap tryout
      const resultsObj = {};
      for (const t of res.data) {
        try {
          const r = await fetchTryoutResult(t.id);
          resultsObj[t.id] = r.data;
        } catch (e) {
          console.log("Belum ada result untuk tryout", t.id);
        }
      }
      setResults(resultsObj);

      // Ambil data user
      try {
        const userRes = await fetchUser(); // Assuming fetchUser() returns user data
        setUser(userRes.data); // Save user data to state
      } catch (e) {
        console.log("Error fetching user data", e);
      }
    };
    load();
  }, []);

  // Function to toggle navbar state
  const toggleMenu = () => {
    setIsNavbarOpen(!isNavbarOpen); // Toggle the navbar state
  };

  // Handle Logout
  const handleLogout = () => {
    // Remove user authentication data (assuming you store token in localStorage)
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    navigate("/"); // Redirect to login page
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Navbar isNavbarOpen={isNavbarOpen} toggleMenu={toggleMenu} />

      {/* Content Wrapper */}
      <div
        style={{
          display: "flex",
          flex: 1,
          marginLeft: isNavbarOpen ? "22%" : "7%", // Adjust content based on navbar state
          transition: "margin-left 0.3s ease", // Smooth transition for sliding effect
        }}
      >
        {/* Left Container (70%) */}
        <div
          style={{
            flex: 6, // Membuat kontainer ini mengisi 70% ruang
            marginRight: "10px", // Jarak antar kontainer
            padding: "20px",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px", // Menambahkan sudut tumpul
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "25px",
              borderRadius: "10px",
              border: "2px solid #E8E8E8",
            }}
          >
            {/* Display user name if available */}
            {user ? (
              <h2>
                Hallo, {user.first_name} {user.last_name}!
              </h2>
            ) : (
              <p>Loading user data...</p>
            )}
            <p>Siap latihan hari ini?</p>
            <div
              onClick={() => navigate(`/practice`)}
              style={{
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#152D64",
                borderRadius: "5px",
                color: "white",
                paddingTop: "10px",
                paddingBottom: "10px",
                marginRight: "80%",
                width: "auto",
              }}
            >
              Siap
            </div>
          </div>

          <br />
          {/* Kontainer untuk Practice dan Tryout */}
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            {/* Practice Container */}
            <div
              style={{
                flex: 5,
                margin: "10px 20px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div
                onClick={() => navigate(`/practice`)}
                style={{
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "#FFD052",
                  borderRadius: "5px",
                  position: "relative",
                  paddingBottom: "44%",
                }}
              >
                <img
                  src="/icon-Student.png"
                  alt="Logo"
                  style={{
                    width: "68%",
                    height: "auto",
                    position: "absolute",
                    top: "-75px",
                    right: "50px",
                    transform: "translateX(50%)",
                  }}
                />
              </div>
              {/* Teks dan Rank */}
              <div style={{ paddingLeft: "10px", paddingTop: "10px", fontSize: "20", fontWeight: "bold" }}>
                Practice Test
              </div>
              <div style={{ color: "#878787", padding: "10px" }}>Rank #1</div>
            </div>

            <div
              style={{
                flex: 5,
                margin: "10px 20px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div
                onClick={() => navigate(`/tryouts`)}
                style={{
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "#FF7F7F",
                  borderRadius: "5px",
                  position: "relative",
                  paddingBottom: "44%",
                }}
              >
                <img
                  src="/icon-Student.png"
                  alt="Logo"
                  style={{
                    width: "68%",
                    height: "auto",
                    position: "absolute",
                    top: "-75px",
                    right: "50px",
                    transform: "translateX(50%)",
                  }}
                />
              </div>
              {/* Teks dan Rank */}
              <div style={{ paddingLeft: "10px", paddingTop: "10px", fontSize: "20", fontWeight: "bold" }}>
                Tryout
              </div>
              <div style={{ color: "#878787", padding: "10px" }}>Rank #1</div>
            </div>
          </div>
        </div>

        {/* Right Container (30%) */}
        <div
          style={{
            flex: 3,
            marginLeft: "10px",
            padding: "10px",
            backgroundColor: "#e8e8e8",
            borderRadius: "8px",
          }}
        >
          <h3>Hasil Tryout</h3>
          {Object.keys(results).length === 0 ? (
            <p>Belum ada hasil tryout.</p>
          ) : (
            <table border="1" cellPadding="10" style={{ marginTop: "10px" }}>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Benar</th>
                  <th>Salah</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(results).map((r) => (
                  <tr key={r.tryout_id}>
                    <td>{tryouts.find((t) => t.id === r.tryout_id)?.title || "-"}</td>
                    <td>{r.correct}</td>
                    <td>{r.wrong}</td>
                    <td>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#FF4C4C",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
