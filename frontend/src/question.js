import { useState, useEffect } from "react";
import { fetchQuestions, saveDraft } from "../api/api";

export default function Question({ token, tryoutId }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchQuestions(tryoutId, token).then(res => setQuestions(res.data));
  }, [tryoutId, token]);

  const handleSelect = (qid, option) => {
    setAnswers({ ...answers, [qid]: option });
  };

  const handleSaveDraft = async () => {
    const payload = Object.entries(answers).map(([qid, sel]) => ({
      question: parseInt(qid),
      selected_option: sel
    }));
    await saveDraft(payload, token);
    alert("Draft saved");
  };

  return (
    <div>
      {questions.map(q => (
        <div key={q.id}>
          <p>{q.text}</p>
          {q.image && <img src={q.image} alt="soal" width={200} />}
          {["A","B","C","D"].map(opt => (
            <div key={opt}>
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id]===opt}
                onChange={()=>handleSelect(q.id,opt)}
              />
              {q[`option_${opt.toLowerCase()}`]}
              {q[`option_${opt.toLowerCase()}_image`] && 
                <img src={q[`option_${opt.toLowerCase()}_image`]} width={100} alt={opt}/>}
            </div>
          ))}
        </div>
      ))}
      <button onClick={handleSaveDraft}>Save Draft</button>
    </div>
  );
}
