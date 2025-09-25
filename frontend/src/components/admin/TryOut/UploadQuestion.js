import { useState, useEffect } from "react";
import { uploadQuestion, fetchQuestions } from "../../../api/api";

export default function UploadQuestion({ tryoutId }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

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

  // ambil daftar soal
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetchQuestions(tryoutId);
        setQuestions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadQuestions();
  }, [tryoutId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("tryout", tryoutId);
    formData.append("text", text);
    if (image) formData.append("image", image);

    formData.append("option_a", optionA);
    if (optionAImage) formData.append("option_a_image", optionAImage);
    formData.append("option_b", optionB);
    if (optionBImage) formData.append("option_b_image", optionBImage);
    formData.append("option_c", optionC);
    if (optionCImage) formData.append("option_c_image", optionCImage);
    formData.append("option_d", optionD);
    if (optionDImage) formData.append("option_d_image", optionDImage);
    formData.append("option_e", optionE);
    if (optionEImage) formData.append("option_e_image", optionEImage);

    formData.append("answer", answer);
    formData.append("explanation", explanation);
    if (explanationImage)
      formData.append("explanation_image", explanationImage);

    try {
      const res = await uploadQuestion(formData);
      alert("Soal berhasil diupload!");

      // reset form
      setText("");
      setImage(null);
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
    <div style={{ maxWidth: 600 }}>
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <textarea
          placeholder="Question Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
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
          placeholder="Explanation (optional)"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setExplanationImage(e.target.files[0])}
        />

        <button type="submit">Upload Question</button>
      </form>

      <h4>Daftar Soal</h4>
      <ul>
        {questions.map((q) => (
          <li key={q.id} style={{ marginBottom: "15px" }}>
            <strong>{q.text}</strong> <br />
            {q.image && (
              <img
                src={q.image}
                alt="question"
                style={{ maxWidth: "200px", display: "block" }}
              />
            )}
            A: {q.option_a}{" "}
            {q.option_a_image && (
              <img src={q.option_a_image} alt="A" style={{ maxWidth: "100px" }} />
            )}
            <br />
            B: {q.option_b}{" "}
            {q.option_b_image && (
              <img src={q.option_b_image} alt="B" style={{ maxWidth: "100px" }} />
            )}
            <br />
            C: {q.option_c}{" "}
            {q.option_c_image && (
              <img src={q.option_c_image} alt="C" style={{ maxWidth: "100px" }} />
            )}
            <br />
            D: {q.option_d}{" "}
            {q.option_d_image && (
              <img src={q.option_d_image} alt="D" style={{ maxWidth: "100px" }} />
            )}
            <br />
            E: {q.option_e}{" "}
            {q.option_e_image && (
              <img src={q.option_e_image} alt="E" style={{ maxWidth: "100px" }} />
            )}
            <br />
            <strong>Jawaban benar:</strong> {q.answer}
            <br />
            {q.explanation && <em>Penjelasan: {q.explanation}</em>}
            {q.explanation_image && (
              <img
                src={q.explanation_image}
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
