import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/login";
import AdminDashboard from "./components/admin/adminDashboard";
import UserDashboard from "./components/user/userDashboard";
import TryoutPage from "./components/user/TryOut/tryoutpage";
import API from "./api/api";
import UploadQuestion from "./components/admin/TryOut/UploadQuestion";
import { useParams } from "react-router-dom";
import CreateTryout from "./components/admin/TryOut/CreateTryOut";
import CreatePracticeTest from "./components/admin/PracticeTest/CreatePracticeTest";
import CreateMateri from "./components/admin/PracticeTest/CreateMateri";
import Latihan from "./components/admin/PracticeTest/Latihan";
import LatihanSoal from "./components/admin/PracticeTest/LatihanSoal";
import RegisterPage from "./components/register";
import OtpForm from "./components/otpform";
import PracticeList from "./components/user/practiceTest/listpractice";
import DetailMateri from "./components/user/practiceTest/detailmateri";
import LatihanUser from "./components/user/practiceTest/latihan";
import LatihansoalUser from "./components/user/practiceTest/latihansoal";

function UploadQuestionPage() {
  const { tryoutId } = useParams();
  return <UploadQuestion tryoutId={tryoutId} />;
}

function UploadMateriPage() {
  const { practiceId } = useParams();
  return <CreateMateri practiceId={practiceId} />;
}

function App() {
  const [user, setUser] = useState(null); // simpan info user dari backend
  const [loading, setLoading] = useState(true);

  // cek token & fetch user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.get("me/") // endpoint backend untuk ambil info user
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OtpForm setUser={setUser} />} />

        {/* Login page */}

        <Route
          path="/"
          element={
            user ? (
              user.is_staff ? (
                <Navigate to="/dashboard_admin" />
              ) : (
                <Navigate to="/dashboard_user" />
              )
            ) : (
              <Login setUser={setUser} />
            )
          }
        />

        {/* Admin page */}
        <Route
          path="/dashboard_admin"
          element={
            user && user.is_staff ? <AdminDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/admin/tryout/:tryoutId"
          element={<UploadQuestionPage />}
        />
        {/* <Route path="/upload-question" element={user && user.is_staff ? <UploadQuestion /> : <Navigate to="/" />}/> */}
        <Route path="create-tryout" element={<CreateTryout />} />

        <Route path="create-practice-test" element={<CreatePracticeTest />} />
        <Route path="/materi/:practiceId" element={<UploadMateriPage />} />
        <Route
          path="/upload-materi"
          element={
            user && user.is_staff ? <CreateMateri /> : <Navigate to="/" />
          }
        />

        <Route path="/latihan/:materiId" element={<Latihan />} />

        <Route path="/admin/latihan/:latihanId" element={<LatihanSoal />} />

        {/* User page */}
        <Route
          path="/dashboard_user"
          element={
            user && !user.is_staff ? <UserDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/tryouts"
          element={
            user && !user.is_staff ? <TryoutPage /> : <Navigate to="/" />
          }
        />

        <Route
          path="/practice"
          element={
            user && !user.is_staff ? <PracticeList /> : <Navigate to="/" />
          }
        />
        {/* <Route
          path="/materi-practice/:practiceId"
          element={
            user && !user.is_staff ? <Materi /> : <Navigate to="/" />
          }
        /> */}
        <Route
          path="/detail-materi/:materiId"
          element={
            user && !user.is_staff ? <DetailMateri /> : <Navigate to="/" />
          }
        />
        <Route
          path="/latihan-materi/:materiId"
          element={
            user && !user.is_staff ? <LatihanUser /> : <Navigate to="/" />
          }
        />
        <Route
          path="/latihan-soal/:latihanId"
          element={
            user && !user.is_staff ? <LatihansoalUser /> : <Navigate to="/" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
