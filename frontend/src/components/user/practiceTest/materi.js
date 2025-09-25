// import { useEffect, useState } from "react";
// import { fetchMateri } from "../../../api/api";
// import ReactMarkdown from "react-markdown";
// import { useNavigate, useParams } from "react-router-dom";

// export default function Materi({ token }) {
//   const { practiceId } = useParams(); // Get practiceId from URL params
//   const [materi, setMateri] = useState([]); // State to store fetched materi data
//   const [loading, setLoading] = useState(true); // Loading state
//   const [error, setError] = useState(null); // Error state
//   const [showModal, setShowModal] = useState(false); // State to show modal
//   const [selectedMateriId, setSelectedMateriId] = useState(null); // Store selected materi ID
//   const navigate = useNavigate(); // Use navigate to redirect

//   // Fetch materi when component mounts or when practiceId or token changes
//   useEffect(() => {
//     const loadMateri = async () => {
//       if (!practiceId) {
//         console.error("No practiceId provided in URL.");
//         setError("Invalid practice ID.");
//         setLoading(false);
//         return;
//       }

//       try {
//         console.log(`Fetching materi with practice_id=${practiceId}`);
//         const res = await fetchMateri(practiceId); // Pass valid practiceId to fetchMateri
//         setMateri(res.data);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching materi:", err);
//         setError("Failed to load materi.");
//         setLoading(false);
//       }
//     };

//     loadMateri();
//   }, [practiceId, token]); // Trigger when practiceId or token changes

//   // If loading, show loading message
//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   // If there is an error, display the error message
//   if (error) {
//     return <div>{error}</div>;
//   }

//   // Function to handle clicking on a materi item
//   const handlePracticeClick = (id) => {
//     setSelectedMateriId(id);
//     setShowModal(true); // Show modal when a materi item is clicked
//   };

//   // Function to handle modal button clicks
//   const handleModalButtonClick = (action) => {
//     setShowModal(false); // Close the modal

//     if (action === "detail-materi") {
//       navigate(`/detail-materi/${selectedMateriId}`); // Navigate to the detail materi page
//     } else if (action === "latihan") {
//       navigate(`/latihan-materi/${selectedMateriId}`); // Navigate to the latihan page
//     }
//   };

//   return (
//     <div>
//       <h2>Materi</h2>
//       <ul>
//         {materi.map((m) => (
//           <li key={m.id} style={{ marginBottom: "20px" }}>
//             <strong>{m.judul_materi}</strong>
//             <button
//               onClick={() => handlePracticeClick(m.id)} // Show modal on click
//               style={{ marginLeft: "10px" }}
//             >
//               Lihat Detail
//             </button>
//           </li>
//         ))}
//       </ul>

//       {/* Modal for selecting action */}
//       {showModal && (
//         <div style={modalStyles}>
//           <div style={modalContentStyles}>
//             <h3>Choose an Action</h3>
//             <button onClick={() => handleModalButtonClick("detail-materi")}>
//               Detail Materi
//             </button>
//             <button onClick={() => handleModalButtonClick("latihan")}>
//               Latihan
//             </button>
//             <button onClick={() => setShowModal(false)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Styles for the modal
// const modalStyles = {
//   position: "fixed",
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: "rgba(0, 0, 0, 0.5)", // Background overlay
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   zIndex: 1000,
// };

// // Modal content styles
// const modalContentStyles = {
//   backgroundColor: "white",
//   padding: "20px",
//   borderRadius: "8px",
//   boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
//   textAlign: "center",
// };
