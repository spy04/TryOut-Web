import { useEffect, useState } from "react";
import { fetchLatihan, uploadLatihan } from "../../../api/api";
import { useNavigate, useParams } from "react-router-dom";

export default function Latihan() {
  const { materiId } = useParams();
  const navigate = useNavigate();

  const [latihan, setLatihan] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [selectedLatihan, setSelectedLatihan] = useState(null);

  // Load daftar latihan per materi
  useEffect(() => {
    const loadLatihan = async () => {
      try {
        const res = await fetchLatihan(materiId); // pastikan API mendukung filter by materiId
        setLatihan(res.data);
      } catch (err) {
        console.error("Error fetching latihan:", err);
      }
    };
    loadLatihan();
  }, [materiId]);

  // Submit latihan baru
  const handleLatihan = async () => {
    if (!newTitle) {
      alert("Judul latihan wajib diisi");
      return;
    }

    if (!materiId) {
      alert("Materi tidak valid");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title_latihan", newTitle);
      formData.append("latihan", materiId); // sesuai serializer, kirim field 'latihan' = id materi

      const res = await uploadLatihan(formData);
      setLatihan(prev => [...prev, res.data]);
      setNewTitle("");
      alert("Latihan berhasil dibuat!");
    } catch (err) {
      console.error(err);
      alert("Gagal membuat latihan");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto" }}>
      <h2>Admin Dashboard</h2>

      <h3>Buat Latihan Test Baru</h3>
      <input
        placeholder="Judul Latihan Test"
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <button onClick={handleLatihan}>Buat Latihan</button>

      <h3>Daftar Latihan Test</h3>
      <ul>
        {latihan.map(t => (
          <li key={t.id} style={{ marginBottom: "10px" }}>
            <strong>{t.title_latihan}</strong>
            <button
              onClick={() => setSelectedLatihan(t)}
              style={{ marginLeft: "10px" }}
            >
              Lihat Detail
            </button>
            <button
              onClick={() => navigate(`/admin/latihan/${t.id}`)}
              style={{ marginLeft: "10px" }}
            >
              Edit Materi
            </button>
          </li>
        ))}
      </ul>

      {selectedLatihan && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <h3>Detail untuk: {selectedLatihan.title_latihan}</h3>
          <p>{selectedLatihan.description || "-"}</p>
        </div>
      )}
    </div>
  );
}
