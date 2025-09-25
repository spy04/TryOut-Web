import { useEffect, useState } from "react";
import { fetchQuestions, saveDraft, submitFinal } from "../../../api/api";


export default function Question({ tryoutId }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);


  // Load questions
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchQuestions(tryoutId);
        console.log("Questions loaded:", res.data);

        // Map ke format A/B/C/D
        const questionsFormatted = (res.data || []).map((q) => ({
          id: q.id,
          question_text: q.text,
          explanation: q.explanation,
          image: q.image, // gambar utama soal
          explanation_image: q.explanation_image, // gambar penjelasan
          choices: [
            { key: "A", text: q.option_a, image: q.option_a_image },
            { key: "B", text: q.option_b, image: q.option_b_image },
            { key: "C", text: q.option_c, image: q.option_c_image },
            { key: "D", text: q.option_d, image: q.option_d_image },
            { key: "E", text: q.option_e, image: q.option_e_image },
          ],
        }));
        setQuestions(questionsFormatted);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load questions:", err);
      }
    };
    if (tryoutId) load();
  }, [tryoutId]);

  // Handle selecting an answer
  const handleAnswer = (qId, key) => {
    const newAnswers = { ...answers, [Number(qId)]: key };
    setAnswers(newAnswers);
    console.log("Answer selected:", newAnswers);
    saveDraft({ [qId]: key });
  };

  // Submit all answers
  const handleSubmit = async () => {
    const formattedAnswers = {};
    for (const [qId, key] of Object.entries(answers)) {
      formattedAnswers[Number(qId)] = key; // kirim A/B/C/D
    }
    console.log("Formatted answers to send:", formattedAnswers);

    try {
      const res = await submitFinal(tryoutId, formattedAnswers);
      console.log("Score from backend:", res.data);
      setScore(res.data);
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Submit failed, check console");
    }
  };

  if (loading) return <p>Loading questions...</p>;

  return (
  <div>
    <h2>Tryout Questions</h2>

    {questions.length > 0 && (
      <div>
        {/* ambil soal sesuai index */}
        {(() => {
          const q = questions[currentIndex];
          return (
            <div key={q.id} style={{ marginBottom: "15px" }}>
              <p>
                <strong>
                  Question {currentIndex + 1} / {questions.length}
                </strong>
              </p>
              <p>{q.question_text}</p>

              {q.image && (
                <img
                  src={q.image}
                  alt="question"
                  style={{ maxWidth: "300px", display: "block" }}
                />
              )}

              {q.choices.map((c) => (
                <div key={c.key} style={{ marginBottom: "5px" }}>
                  <label>
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={c.key}
                      checked={answers[q.id] === c.key}
                      onChange={() => handleAnswer(q.id, c.key)}
                    />
                    <strong>{c.key}:</strong> {c.text && <span>{c.text}</span>}
                  </label>
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.key}
                      style={{
                        maxWidth: "100px",
                        display: "block",
                        marginTop: "5px",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {/* tombol navigasi */}
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
            }
            disabled={currentIndex === questions.length - 1}
            style={{ marginLeft: "10px" }}
          >
            Next
          </button>
        </div>
      </div>
    )}

    {/* submit di akhir */}
    {currentIndex === questions.length - 1 && (
      <button onClick={handleSubmit} style={{ marginTop: "20px" }}>
        Submit All
      </button>
    )}

    {score && (
      <div style={{ marginTop: "20px" }}>
        <h3>Results</h3>
        <p>Correct: {score.correct}</p>
        <p>Wrong: {score.wrong}</p>

        {score.results?.map((r) => (
          <div
            key={r.question_id}
            style={{
              backgroundColor: r.is_correct ? "#c8f7c5" : "#f7c5c5",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "5px",
            }}
          >
            <p>
              <strong>Question {r.question_id}</strong>
            </p>
            <p>Your answer: {r.selected}</p>
            <p>Correct answer: {r.correct}</p>
            <p>Explanation: {r.explanation || "No explanation"}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

}
