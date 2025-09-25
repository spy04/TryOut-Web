import { useEffect, useState } from "react";
import { fetchTryouts } from "../../../api/api";

export default function TryoutList({ token, selectTryout }) {
  const [tryouts, setTryouts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetchTryouts(token);
      setTryouts(res.data);
    };
    load();
  }, [token]);

  return (
    <div>
      <h2>Tryouts</h2>
      <ul>
        {tryouts.map((t) => (
          <li key={t.id}>
            <button onClick={() => selectTryout(t.id)}>{t.title}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
