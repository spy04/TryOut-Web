// CreateTryout.js
import { useEffect, useState } from "react";
import { fetchTryouts as fetchTryoutsAPI, uploadTryout } from "../../../api/api"; // sesuaikan path
import UploadQuestion from "./UploadQuestion";
import { useNavigate } from "react-router-dom";

export default function CreateTryout() {
  const [tryouts, setTryouts] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedTryout] = useState(null);
  const navigate = useNavigate(); 

  // Load tryouts
  useEffect(() => {
    const fetchTryouts = async () => {
      try {
        const res = await fetchTryoutsAPI(); // pakai api.js
        setTryouts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTryouts();
  }, []);

  // Create new tryout
  const handleCreateTryout = async () => {
    try {
      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("description", newDesc);

      const res = await uploadTryout(formData); // pakai api.js
      setTryouts([...tryouts, res.data]);
      setNewTitle("");
      setNewDesc("");
      alert("Tryout berhasil dibuat!");
    } catch (err) {
      console.error(err);
      alert("Gagal membuat tryout");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto" }}>
      <h2>Admin Dashboard</h2>

      <h3>Buat Tryout Baru</h3>
      <input
        placeholder="Judul Tryout"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
      <input
        placeholder="Deskripsi (opsional)"
        value={newDesc}
        onChange={(e) => setNewDesc(e.target.value)}
      />
      <button onClick={handleCreateTryout}>Buat Tryout</button>

      <h3>Daftar Tryout</h3>
      <ul>
        {tryouts.map((to) => (
          <li key={to.id} style={{ marginBottom: "10px" }}>
            <strong>{to.title}</strong> - {to.description || "No description"}
            <button
              onClick={() => navigate(`/admin/tryout/${to.id}`)}
              style={{ marginLeft: "10px" }}
            >
              Tambah/Edit Soal
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
