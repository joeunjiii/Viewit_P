import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./main/Layout.css";
import Main from "./main/Main";
import Login from "./login/Login";
import Interview from "./main/Interview/Interview";
import Layout from "./main/Layout";
import AnalyzingModal from "./main/Interview/asset/AnalyzingModal";
import AssessmentIntro from "./main/Interview/AssessmentIntro";

function App() {
  return (
    <Router>
      <Routes>
        {/*  공개 라우트: 인증 없이 접근 가능  */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route path="main" element={<Main />} />
          <Route path="interview" element={<Interview />} />
        </Route>

        <Route path="AnalyzingModal" element={<AnalyzingModal />} />
        <Route path="AssessmentIntro" element={<AssessmentIntro />} />
      </Routes>
    </Router>
  );
}

export default App;
