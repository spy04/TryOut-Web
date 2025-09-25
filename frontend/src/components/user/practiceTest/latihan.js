import { useEffect, useState } from "react";
import { fetchLatihan } from "../../../api/api";
import { useNavigate, useParams } from "react-router-dom";

export default function LatihanUser({ token }) {
  const { materiId } = useParams(); // Get materiId from URL params
  const [latihan, setLatihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch latihan data on component mount or when materiId or token changes
  useEffect(() => {
    const loadLatihan = async () => {
      if (!materiId) {
        setError("Invalid materi ID.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetchLatihan(materiId);  // Pass materiId from URL to fetchLatihan
        console.log("Latihan Response:", res);  // Debugging line to check response
        if (res && res.data) {
          setLatihan(res.data);  // Set the fetched latihan data
        } else {
          setError("No latihan data found.");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching latihan:", err);
        setError("Failed to load latihan.");
        setLoading(false);
      }
    };

    loadLatihan();
  }, [materiId, token]);  // Fetch data when materiId or token changes

  // Function to handle latihan item click
  const handleLatihanClick = (id) => {
    navigate(`/latihan-soal/${id}`);  // Navigate to latihan details page when clicked
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Latihan</h2>
      <ul>
        {latihan.map((t) => (
          <li key={t.id} style={{ marginBottom: "20px" }}>
            <strong>{t.title_latihan}</strong>
            <button
              onClick={() => handleLatihanClick(t.id)}  // Navigate to detail on click
              style={{ marginLeft: "10px" }}
            >
              Lihat Detail
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
