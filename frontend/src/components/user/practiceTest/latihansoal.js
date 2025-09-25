import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Import useParams
import { fetchLatihanSoal, submitLatihan } from "../../../api/api";

export default function LatihansoalUser() {
  const { latihanId } = useParams(); // Ambil latihanId dari URL
  const [latihan, setLatihan] = useState([]); // Store all the latihan data
  const [answers, setAnswers] = useState({}); // Store answers for each question
  const [correctCount, setCorrectCount] = useState(0); // Correct answer counter
  const [totalAnswered, setTotalAnswered] = useState(0); // Total answered counter
  const [loading, setLoading] = useState(true); // Loading state
  const [score, setScore] = useState({}); // Store results for each question
  const [currentIndex, setCurrentIndex] = useState(0); // Track current question index
  const [showModal, setShowModal] = useState(false); // To show modal after submit
  const [modalContent, setModalContent] = useState({}); // To hold modal content like correct answer and explanation

  // Load latihan
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchLatihanSoal(latihanId); // Gunakan latihanId dari URL
        console.log("Latihan loaded:", res.data);

        const latihanFormated = (res.data || []).map((q) => ({
          id: q.id,
          question_text: q.text_latihan,
          explanation: q.explanation_latihan, // Simpan explanation_latihan dari soal
          correct_answer: q.answer_latihan,
          image: q.image_latihan,
          explanation_image: q.explanation_image_latihan,
          choices: [
            { key: "A", text: q.option_a_latihan, image: q.option_a_image_latihan },
            { key: "B", text: q.option_b_latihan, image: q.option_b_image_latihan },
            { key: "C", text: q.option_c_latihan, image: q.option_c_image_latihan },
            { key: "D", text: q.option_d_latihan, image: q.option_d_image_latihan },
            { key: "E", text: q.option_e_latihan, image: q.option_e_image_latihan },
          ],
        }));
        setLatihan(latihanFormated);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load latihan:", err);
      }
    };
    if (latihanId) load();
  }, [latihanId]);

  // Handle selecting an answer
  const handleAnswer = (questionId, optionKey) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: optionKey,
    }));
  };

  // Handle submitting each answer and update the score
  const handleSubmit = async (questionId) => {
    const userAnswer = answers[questionId];
    try {
      // Kirim jawaban ke API
      const res = await submitLatihan(latihanId, { [questionId]: userAnswer });
      console.log("Submit response:", res.data); // Debugging

      const correct = res.data.results[0].correct === userAnswer;

      // Set score
      setScore((prevScore) => ({
        ...prevScore,
        [questionId]: {
          correct: correct,
          selected: userAnswer,
          correct_answer: res.data.results[0].correct,
          explanation: latihan.find((q) => q.id === questionId)?.explanation || "No explanation", // Ambil explanation dari soal
        },
      }));

      // Set modal content based on correctness
      if (correct) {
        setModalContent({
          type: "correct", // Type for correct answer modal
          explanation: latihan.find((q) => q.id === questionId)?.explanation || "No explanation",
        });
      } else {
        setModalContent({
          type: "incorrect", // Type for incorrect answer modal
          userAnswer: userAnswer,
          correctAnswer: res.data.results[0].correct,
          explanation: latihan.find((q) => q.id === questionId)?.explanation || "No explanation",
        });
      }

      // Show the modal
      setShowModal(true);

      // Update counters
      if (correct) {
        setCorrectCount((prevCount) => prevCount + 1);
      }
      if (!score[questionId]) {
        setTotalAnswered((prevCount) => prevCount + 1);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Submit failed, check console");
    }
  };

  // Navigation logic
  const handleNavigation = (direction) => {
    if (direction === "next") {
      setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, latihan.length - 1));
    } else if (direction === "previous") {
      setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    }
  };

  // Loading screen
  if (loading) return <p>Loading latihan...</p>;

  // Close Modal
  const closeModal = () => setShowModal(false);

  return (
    <div>
      <h2>Latihan soal</h2>

      {/* Score Indicator */}
      <div>
        <p>
          {totalAnswered}/{latihan.length} answered, {correctCount} correct
        </p>
      </div>

      {latihan.length > 0 && (
        <div>
          {/* Show current question */}
          {(() => {
            const q = latihan[currentIndex];
            return (
              <div key={q.id} style={{ marginBottom: "15px" }}>
                <p>
                  <strong>
                    Question {currentIndex + 1} / {latihan.length}
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

                {/* Button to submit this question */}
                {answers[q.id] && (
                  <button
                    onClick={() => handleSubmit(q.id)}
                    style={{ marginTop: "10px" }}
                  >
                    Submit
                  </button>
                )}
              </div>
            );
          })()}

          {/* Navigation buttons */}
          <div style={{ marginTop: "10px" }}>
            <button onClick={() => handleNavigation("previous")} disabled={currentIndex === 0}>
              Previous
            </button>
            <button
              onClick={() => handleNavigation("next")}
              disabled={currentIndex === latihan.length - 1}
              style={{ marginLeft: "10px" }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal Pop-up */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            {modalContent.type === "correct" ? (
              <>
                <h3>You are Correct!</h3>
                <p>
                  <strong>Explanation:</strong> {modalContent.explanation}
                </p>
              </>
            ) : (
              <>
                <h3>You are Incorrect!</h3>
                <p>
                  <strong>Your answer:</strong> {modalContent.userAnswer}
                </p>
                <p>
                  <strong>The correct answer:</strong> {modalContent.correctAnswer}
                </p>
                <p>
                  <strong>Explanation:</strong> {modalContent.explanation}
                </p>
              </>
            )}
            <button onClick={closeModal} style={modalStyles.button}>Close</button>
          </div>
        </div>
      )}

 

    </div>
  );
}

// Styling for modal
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "300px",
    textAlign: "center",
  },
  button: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
