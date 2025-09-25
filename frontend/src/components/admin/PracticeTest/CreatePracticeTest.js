import { useEffect, useState } from "react";
import { fetchPracticeTests, uploadPracticeTest } from "../../../api/api"; // Sesuaikan path
import { useNavigate } from "react-router-dom";

export default function CreatePracticeTest() {
  const [practiceTest, setPracticeTest] = useState([]); // Nama variabel disesuaikan
  const [newTitle, setNewTitle] = useState("");
  const [selectedPractice, setSelectedPractice] = useState(null); // Menambahkan state untuk selectedPractice
  const navigate = useNavigate();

  // Load practiceTest (ambil semua data)
  useEffect(() => {
    const fetchPracticeTestsData = async () => {
      try {
        const res = await fetchPracticeTests(); // Memanggil fetchPracticeTests untuk mengambil seluruh data
        setPracticeTest(res.data); // Menyimpan data practice test
      } catch (err) {
        console.error(err);
      }
    };
    fetchPracticeTestsData();
  }, []); // Hanya dijalankan sekali saat komponen pertama kali dimuat

  // Mengambil detail practice test saat selectedPractice dipilih
  useEffect(() => {
    if (selectedPractice && selectedPractice.id) {
      const fetchPracticeTestDetailData = async () => {
        try {
          const res = await fetchPracticeTests(selectedPractice.id); // Ambil detail practice test berdasarkan id
          // Set data detail hanya jika tidak sama dengan yang sudah ada
          setSelectedPractice(prevState => {
            if (prevState && prevState.id !== res.data.id) {
              return res.data;
            }
            return prevState; // Jangan update state jika data sama
          });
        } catch (err) {
          console.error(err);
        }
      };
      fetchPracticeTestDetailData();
    }
  }, [selectedPractice?.id]); // Hanya dijalankan jika id practice test berubah

  // Create new practice test
  const handleCreatePracticeTest = async () => {
    try {
      const formData = new FormData();
      formData.append("title_practice", newTitle); // Ganti dari "title" ke "title_practice"

      const res = await uploadPracticeTest(formData); // Pakai api.js
      setPracticeTest([...practiceTest, res.data]); // Menambah practice test baru ke daftar
      setNewTitle("");
      alert("Practice Test berhasil dibuat!");
    } catch (err) {
      console.error(err);
      alert("Gagal membuat practice test");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto" }}>
      <h2>Admin Dashboard</h2>

      <h3>Buat Practice Test Baru</h3>
      <input
        placeholder="Judul Practice Test"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
     
      <button onClick={handleCreatePracticeTest}>Buat Practice</button>

      <h3>Daftar Practice Test</h3>
      <ul>
        {practiceTest.map((t) => (
          <li key={t.id} style={{ marginBottom: "10px" }}>
            <strong>{t.title_practice}</strong>
            <button
              onClick={() => navigate(`/materi/${t.id}`)}
              style={{ marginLeft: "10px" }}
            >
              Lihat Detail
            </button>
          </li>
        ))}
      </ul>

      {selectedPractice && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <h3>Detail untuk: {selectedPractice.title_practice}</h3>
          {/* Tampilkan informasi lebih lanjut atau upload soal */}
          <p>{selectedPractice.description}</p> {/* Asumsi ada deskripsi, sesuaikan dengan field yang ada */}
        </div>
      )}
    </div>
  );
}
