import { useEffect, useState } from "react";
import { fetchPracticeTests, fetchMateri } from "../../../api/api";
import { useNavigate } from "react-router-dom";
import Navbar from "./../navbar"; // Import Navbar component

export default function PracticeList({ token }) {
  const [practice, setPracticeTest] = useState([]); // Daftar practice
  const [materi, setMateri] = useState([]); // Materi terkait practice
  const [selectedMateriId, setSelectedMateriId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false); // State to show modal

  // List of available background colors
  const colors = ["#F57779", "#FFD052", "#50D759"];

  // Function to get a random color from the colors array
  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Fetch practice tests
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchPracticeTests(token);
        setPracticeTest(res.data); // Set daftar practice
        setLoading(false);

        // Setelah practice di-fetch, fetch materi untuk setiap practice
        let materiData = []; // Create a temporary array to hold materi data
        for (const practiceItem of res.data) {
          try {
            const materiRes = await fetchMateri(practiceItem.id); // Fetch materi untuk practice
            // Prevent adding duplicate materi
            const existingMateri = materiData.find(
              (m) => m.practiceId === practiceItem.id
            );
            if (!existingMateri) {
              materiData.push({
                practiceId: practiceItem.id,
                materi: materiRes.data,
              });
            }
          } catch (err) {
            console.error("Failed to load materi for practice:", err);
          }
        }
        setMateri(materiData); // Set the materi once all data is fetched
      } catch (err) {
        setError("Failed to load practice tests.");
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // If loading or error, display accordingly
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Toggle Navbar menu
  const toggleMenu = () => setIsNavbarOpen(!isNavbarOpen);

  const handlePracticeClick = (id) => {
    setSelectedMateriId(id);
    setShowModal(true); // Show modal when a materi item is clicked
  };

  // Handle modal button clicks
  const handleModalButtonClick = (action) => {
    setShowModal(false); // Close the modal

    if (action === "detail-materi") {
      navigate(`/detail-materi/${selectedMateriId}`); // Navigate to the detail materi page
    } else if (action === "latihan") {
      navigate(`/latihan-materi/${selectedMateriId}`); // Navigate to latihan materi page
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        marginLeft: isNavbarOpen ? "22%" : "7%",
        transition: "margin-left 0.3s ease",
      }}
    >
      {/* Sidebar */}
      <Navbar isNavbarOpen={isNavbarOpen} toggleMenu={toggleMenu} />

      {/* Content */}
      <div
        style={{
          flex: 6,
          marginRight: "10px",
          padding: "20px",
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
        }}
      >
        <div>
          <i
            className="fas fa-chalkboard-teacher"
            style={{ fontSize: "24px" }}
          />
          <span
            style={{ padding: "10px", fontSize: "24px", fontWeight: "bold" }}
          >
            Practice
          </span>
          <ul>
            {practice.map((t) => (
              <li key={t.id} style={{ listStyle: "none" }}>
                <strong style={{fontSize:"18px"}}>{t.title_practice}</strong>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap", // Wrap materi horizontally
                    gap: "30px", // Space between the materi items
                  }}
                >
                  {materi
                    .filter((m) => m.practiceId === t.id) // Filter materi berdasarkan practiceId
                    .map((m) => (
                      <div
                        key={m.practiceId}
                        style={{
                          display: "flex",
                          flexWrap: "wrap", // Wrap horizontally for multiple materi
                          gap: "10px",
                        }}
                      >
                        {m.materi.map((materiItem) => (
                          <ul
                            key={materiItem.id}
                            style={{
                              listStyle: "none",
                              backgroundColor: getRandomColor(),
                              width: "200px",
                              height: "120px",
                              borderRadius: "10px",
                              padding: "10px",
                              display: "flex",
                              flexDirection: "column", // Arrange contents vertically
                              justifyContent: "space-between", // Distribute space
                              position: "relative", // Make sure the button can be positioned at the bottom
                            }}
                          >
                            <li
                              key={materiItem.id}
                              style={{
                                marginBottom: "20px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                              }}
                            >
                              <strong style={{ textAlign: "left" }}>
                                {materiItem.judul_materi}
                              </strong>

                              {/* Button placed at the bottom of the div */}
                              <button
                                onClick={() => {
                                  handlePracticeClick(materiItem.id); // Show modal for detail or latihan
                                }}
                                style={{
                                  position: "absolute", // Position the button absolutely within the div
                                  bottom: "10px", // Push the button to the bottom of the container
                                  left: "50%",
                                  transform: "translateX(-50%)", // Center the button horizontally
                                  padding: "10px",
                                  backgroundColor: "#152D64",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "5px",
                                  width: "80%", // Button width to ensure it stays within the div
                                }}
                              >
                                Start
                              </button>
                            </li>
                          </ul>
                        ))}
                      </div>
                    ))}
                </div>
              </li>
            ))}
          </ul>

          {showModal && (
            <div style={modalStyles}>
              <div style={modalContentStyles}>
                <h3>Choose an Action</h3>
                <button onClick={() => handleModalButtonClick("detail-materi")}>
                  Detail Materi
                </button>
                <button onClick={() => handleModalButtonClick("latihan")}>
                  Latihan
                </button>
                <button onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar (empty here) */}
      <div
        style={{
          flex: 3,
          marginLeft: "10px",
          padding: "10px",
          backgroundColor: "#e8e8e8",
          borderRadius: "8px",
        }}
      ></div>
    </div>
  );
}

// Styles for the modal
const modalStyles = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

// Modal content styles
const modalContentStyles = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
  textAlign: "center",
};
