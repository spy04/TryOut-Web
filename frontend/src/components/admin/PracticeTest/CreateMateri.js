import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { uploadMateri, fetchMateri, fetchPracticeTests, UPLOAD_IMAGE_URL } from "../../../api/api";
import CustomEditor from '../../../ckeditor/CustomEditor';
import '../../../App.css'
import ReactMarkdown from 'react-markdown';

import { useNavigate } from 'react-router-dom';



export default function CreateMateri() {
  const { practiceId } = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // HTML dari CKEditor
  const [image, setImage] = useState(null);
  const [materi, setMateri] = useState([]);
  const [selectedPracticeTestId, setSelectedPracticeTestId] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const loadPracticeTest = async () => {
      try {
        const res = await fetchPracticeTests();
        const selectedTest = res.data.find(test => test.id === parseInt(practiceId));
        setSelectedPracticeTestId(selectedTest ? selectedTest.id : null);
      } catch (err) {
        console.error("Error fetching practice test", err);
      }
    };
    loadPracticeTest();
  }, [practiceId]);

  useEffect(() => {
    const loadMateri = async () => {
      try {
        const res = await fetchMateri(practiceId);
        setMateri(res.data);
      } catch (err) {
        console.error("Error fetching materi", err);
      }
    };
    loadMateri();
  }, [practiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      alert("Judul dan konten wajib diisi");
      return;
    }

    const formData = new FormData();
    formData.append("judul_materi", title);
    formData.append("konten_materi", content); // simpan HTML dari CKEditor
    formData.append("practicetest", Number(selectedPracticeTestId));
    formData.append("penulis_materi", 1); 
    if (image) formData.append("image_materi", image);

    try {
      const res = await uploadMateri(formData);
      alert("Materi berhasil diupload!");
      setTitle("");
      setContent("");
      setImage(null);
      setMateri(prev => [...prev, res.data]);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Gagal upload materi");
    }
  };

  if (!selectedPracticeTestId) return <div>Loading Practice Test...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "20px auto" }}>
      <h2>Buat Materi Test Baru</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Judul Materi"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />

        <div style={{ minHeight: 200, marginBottom: 10 }}>
          <CustomEditor
  editor={CustomEditor}
  initialData={content}
  onChange={(data) => setContent(data)}
  config={{
    simpleUpload: { uploadUrl: UPLOAD_IMAGE_URL },
    image: {
      resizeOptions: [
        { name: 'original', label: 'Original', value: null },
        { name: '50', label: '50%', value: '50' },
        { name: '75', label: '75%', value: '75' }
      ],
      toolbar: ['imageTextAlternative', 'resizeImage']
    }
  }}
/>

        </div>

        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
          style={{ marginBottom: 10 }}
        />

        <button type="submit">Upload Materi</button>
      </form>

      <h4>Daftar Materi</h4>
      <ul>
        {materi.map(m => (
          <li key={m.id} style={{ marginBottom: "20px" }}>
            <strong>{m.judul_materi}</strong>
            <button
              onClick={() => navigate(`/latihan/${m.id}`)}
              style={{ marginLeft: "10px" }}
            >
              Lihat Detail
            </button>
            <br />
            <div className="materi-content">
  <ReactMarkdown>
    {m.konten_materi}
  </ReactMarkdown>
</div>


            <small>Slug: {m.slug_materi}</small><br />
            <small>Penulis: {m.penulis_materi}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
