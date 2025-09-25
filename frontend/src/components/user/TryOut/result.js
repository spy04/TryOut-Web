import { submitFinal } from "../../../api/api";

export default function Result({ token }) {
  const handleSubmit = async () => {
    const res = await submitFinal(token);
    alert(`Correct: ${res.data.correct} / ${res.data.total_questions}`);
  };

  return <button onClick={handleSubmit}>Submit Final</button>;
}
