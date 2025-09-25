// AdminDashboard.js
import { useEffect, useState } from "react";
import {
  fetchTryouts as fetchTryoutsAPI,
  fetchPracticeTests,
} from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [tryouts, setTryouts] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const navigate = useNavigate();

  // Load tryouts & practice tests
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tryoutRes = await fetchTryoutsAPI();
        setTryouts(tryoutRes.data);

        const practiceRes = await fetchPracticeTests();
        setPracticeTests(practiceRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "20px auto" }}>
      <h2>Admin Dashboard</h2>

      {/* LIST TRYOUT */}
      <h3>Tryouts</h3>
      <button
        onClick={() => navigate(`/create-tryout/`)}
        style={{ marginLeft: "10px" }}
      >
        Edit / Tambah Soal
      </button>

      {/* LIST PRACTICE TEST */}
      <h3>Practice Tests</h3>
      <button
        onClick={() => navigate(`/create-practice-test/`)}
        style={{ marginLeft: "10px" }}
      >
        Edit / Tambah Soal
      </button>
    </div>
  );
}
