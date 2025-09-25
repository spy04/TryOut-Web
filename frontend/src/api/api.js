import axios from "axios";
import { data } from "react-router-dom";

const API = axios.create({
  baseURL: "https://www.api.tryout-snbt.my.id/api/",
  headers: { "Content-Type": "application/json" },
});

// Ambil token dari localStorage
const getToken = () => localStorage.getItem("token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

// Attach token otomatis untuk semua request
API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Auto-refresh token & redirect ke login kalau gagal
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = getRefreshToken();
      if (!refresh) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(err);
      }
      try {
        const res = await axios.post(`${API.defaults.baseURL}token/refresh/`, { refresh });
        localStorage.setItem("token", res.data.access);
        originalRequest.headers["Authorization"] = `Bearer ${res.data.access}`;
        return API(originalRequest); // retry request awal
      } catch (e) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(e);
      }
    }
    return Promise.reject(err);
  }
);
export const loginUser = async (email, password) => {
  const res = await API.post("login/", { email, password });

  if (res.data.need_otp) {
    return { need_otp: true, email: res.data.email };
  }

  // Simpan token
  localStorage.setItem("token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);

  // Force reload halaman setelah login
  window.location.reload();  // Tambahkan ini agar browser 'refresh' dan baca token baru
  
  return {
    email: res.data.email,
    access: res.data.access,
    refresh: res.data.refresh,
    is_pro: res.data.is_pro || false,
  };
};


// VERIFY OTP
export const verifyOtp = async (email, otp) => {
  const res = await API.post("verify-otp/", { email, otp });

  // OTP valid → backend return access & refresh token
  if (res.data.access) {
    localStorage.setItem("token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
  }


  return res.data;
};


// Get user

export const fetchUser = () => { return API.get("user/detail/") }

// REGISTER
export const registerUser = (data) => {
  return API.post("register/", data); // kirim: { first_name, last_name, phone_number, email, password }
};

export const getMe = async (token) => {
  const res = await API.get("me/", {
    headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` },
  });
  return res.data;
};

// VERIFY OTP
// export const verifyOtp = (email, otp) => {
//   return API.post("verify-otp/", { email, otp });
// };



// resend OTP
export const resendOtp = (email) => {
  return API.post("resend-otp/", { email })
    .catch((err) => {
      console.error("Error while sending OTP:", err.response?.data);
      throw err;
    });
};


// Request API setelah login

export const fetchTryouts = () => API.get("tryouts/");
export const fetchQuestions = (tryoutId) => API.get(`questions/?tryout_id=${tryoutId}`);
export const saveDraft = (data) => API.post("/answer/draft/", data);

// final submit per tryout
export const submitFinal = (tryoutId, data) =>
  API.post(`/tryouts/${tryoutId}/submit/`, data);

// Upload endpoints baru
export const uploadQuestion = (formData) => {
  return API.post("/question/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data", // penting!
    },
  });
};
export const uploadTryout = (data) => API.post("tryout/upload/", data);


export const fetchTryoutResult = async (tryoutId, token) => {
  return API.get(`/tryouts/${tryoutId}/result/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};




export const fetchPracticeTests = () => API.get("practice-tests/");

export const fetchMateri = (practiceId) => {
    console.log(`Fetching materi with practice_id=${practiceId}`);
    return API.get(`materi/?practice_id=${practiceId}`);
};

export const fetchDetailMateri = (materiId) => {
  console.log(`Fetching materi with materi_id=${materiId}`);
  return API.get(`/detail-materi/${materiId}/`);  // Update to use path parameter
};


export const fetchLatihan = (materiId) => {
  console.log("Fetching latihan with materiId=" + materiId); // Debugging line
  return API.get(`latihan/?latihan_id=${materiId}`); // Correct query parameter
};

export const fetchLatihanSoal = (latihanId) => API.get(`latihan-soal/?latihan_id=${latihanId}`);

export const fetchLatihanResult = (latihanId) => API.get(`latihan-soal/${latihanId}/result/`);
export const submitLatihan = (latihanId, data) => API.post(`latihan-soal/${latihanId}/submit/`, data);

// Upload endpoints baru
export const uploadPracticeTest = (data) => {
  return API.post("practice-test/upload/", data);
};

export const uploadMateri = (formData) => {
  return API.post("materi/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data", // penting!
    },
  });
};

export const uploadLatihan = (data) => {
  return API.post("latihan/upload/", data);
};

export const uploadLatihanSoal = (data) => {
  return API.post("latihan-soal/upload/", data,{
    headers: {
      "Content-Type": "multipart/form-data", // penting!
    },
  });
};

export const UPLOAD_IMAGE_URL = `${API.defaults.baseURL}ckeditor/upload/`;

// export const UPLOAD_IMAGE_URL = `${BASE_URL}/ckeditor/upload/`;



export default API;
