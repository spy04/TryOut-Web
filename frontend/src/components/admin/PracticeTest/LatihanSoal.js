import { useState, useEffect } from "react";
import { uploadLatihanSoal, fetchLatihanSoal } from "../../../api/api";
import { useNavigate, useParams } from "react-router-dom";


export default function LatihanSoal() {
  const [textLatihan, setTextLatihan] = useState("");
  const [imageLatihan, setImageLatihan] = useState(null);

  const [optionA, setOptionA] = useState("");
  const [optionAImage, setOptionAImage] = useState(null);
  const [optionB, setOptionB] = useState("");
  const [optionBImage, setOptionBImage] = useState(null);
  const [optionC, setOptionC] = useState("");
  const [optionCImage, setOptionCImage] = useState(null);
  const [optionD, setOptionD] = useState("");
  const [optionDImage, setOptionDImage] = useState(null);
  const [optionE, setOptionE] = useState("");
  const [optionEImage, setOptionEImage] = useState(null);

  const [answer, setAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [explanationImage, setExplanationImage] = useState(null);

  const [questions, setQuestions] = useState([]);
  const { latihanId } = useParams();


  // Load daftar soal
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetchLatihanSoal(latihanId);
        setQuestions(res.data);
      } catch (err) {
        console.error("Error fetching soal:", err);
      }
    };
    loadQuestions();
  }, [latihanId]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!latihanId) {
    alert("Latihan ID tidak valid!");
    console.error("latihanId is undefined!");
    return;
  }

  const formData = new FormData();
  formData.append("latsol", latihanId);
  formData.append("text_latihan", textLatihan);
  if (imageLatihan) formData.append("image_latihan", imageLatihan);

  formData.append("option_a_latihan", optionA);
  if (optionAImage) formData.append("option_a_image_latihan", optionAImage);

  formData.append("option_b_latihan", optionB);
  if (optionBImage) formData.append("option_b_image_latihan", optionBImage);

  formData.append("option_c_latihan", optionC);
  if (optionCImage) formData.append("option_c_image_latihan", optionCImage);

  formData.append("option_d_latihan", optionD);
  if (optionDImage) formData.append("option_d_image_latihan", optionDImage);

  formData.append("option_e_latihan", optionE);
  if (optionEImage) formData.append("option_e_image_latihan", optionEImage);

  formData.append("answer_latihan", answer);
  formData.append("explanation_latihan", explanation);
  if (explanationImage) formData.append("explanation_image_latihan", explanationImage);

  // 🔥 debug: print semua field yang dikirim
  console.log("=== FormData entries ===");
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }
  console.log("========================");

  try {
    const res = await uploadLatihanSoal(formData);
    alert("Soal berhasil diupload!");
    
    // reset form
    setTextLatihan("");
    setImageLatihan(null);
    setOptionA("");
    setOptionAImage(null);
    setOptionB("");
    setOptionBImage(null);
    setOptionC("");
    setOptionCImage(null);
    setOptionD("");
    setOptionDImage(null);
    setOptionE("");
    setOptionEImage(null);
    setAnswer("A");
    setExplanation("");
    setExplanationImage(null);

    // update list soal
    setQuestions([...questions, res.data]);
  } catch (err) {
    console.error(err.response?.data || err);
    alert("Gagal upload soal");
  }
};


  return (
    <div style={{ maxWidth: 600, margin: "20px auto" }}>
      <h4>Latihan Soal</h4>
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <textarea
          placeholder="Teks Soal"
          value={textLatihan}
          onChange={(e) => setTextLatihan(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageLatihan(e.target.files[0])}
        />

        {/* opsi A-E */}
        <input
          placeholder="Option A"
          value={optionA}
          onChange={(e) => setOptionA(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOptionAImage(e.target.files[0])}
        />

        <input
          placeholder="Option B"
          value={optionB}
          onChange={(e) => setOptionB(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOptionBImage(e.target.files[0])}
        />

        <input
          placeholder="Option C"
          value={optionC}
          onChange={(e) => setOptionC(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOptionCImage(e.target.files[0])}
        />

        <input
          placeholder="Option D"
          value={optionD}
          onChange={(e) => setOptionD(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOptionDImage(e.target.files[0])}
        />

        <input
          placeholder="Option E"
          value={optionE}
          onChange={(e) => setOptionE(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOptionEImage(e.target.files[0])}
        />

        <select value={answer} onChange={(e) => setAnswer(e.target.value)}>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="E">E</option>
        </select>

        <textarea
          placeholder="Penjelasan (opsional)"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setExplanationImage(e.target.files[0])}
        />

        <button type="submit">Upload Soal</button>
      </form>

      <h4>Daftar Soal</h4>
      <ul>
        {questions.map((q) => (
          <li key={q.id} style={{ marginBottom: "15px" }}>
            <strong>{q.text_latihan}</strong> <br />
            {q.image_latihan && (
              <img
                src={q.image_latihan}
                alt="soal"
                style={{ maxWidth: "200px", display: "block" }}
              />
            )}
            A: {q.option_a_latihan}{" "}
            {q.option_a_image_latihan && (
              <img
                src={q.option_a_image_latihan}
                alt="A"
                style={{ maxWidth: "100px" }}
              />
            )}
            <br />
            B: {q.option_b_latihan}{" "}
            {q.option_b_image_latihan && (
              <img
                src={q.option_b_image_latihan}
                alt="B"
                style={{ maxWidth: "100px" }}
              />
            )}
            <br />
            C: {q.option_c_latihan}{" "}
            {q.option_c_image_latihan && (
              <img
                src={q.option_c_image_latihan}
                alt="C"
                style={{ maxWidth: "100px" }}
              />
            )}
            <br />
            D: {q.option_d_latihan}{" "}
            {q.option_d_image_latihan && (
              <img
                src={q.option_d_image_latihan}
                alt="D"
                style={{ maxWidth: "100px" }}
              />
            )}
            <br />
            E: {q.option_e_latihan}{" "}
            {q.option_e_image_latihan && (
              <img
                src={q.option_e_image_latihan}
                alt="E"
                style={{ maxWidth: "100px" }}
              />
            )}
            <br />
            <strong>Jawaban benar:</strong> {q.answer_latihan}
            <br />
            {q.explanation_latihan && (
              <em>Penjelasan: {q.explanation_latihan}</em>
            )}
            {q.explanation_image_latihan && (
              <img
                src={q.explanation_image_latihan}
                alt="explanation"
                style={{ maxWidth: "200px", display: "block" }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
    