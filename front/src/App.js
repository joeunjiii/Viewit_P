import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./main/css/Layout.css";
import Main from "./main/Main";
import Login from "./login/Login";
import Layout from "./main/Layout";
import AnalyzingModal from "./main/Interview/asset/AnalyzingModal";
import AssessmentIntro from "./main/Interview/AssessmentIntro";
import InterviewLayout from "./main/maincomponent/InterviewLayout";
import FeedbackResult from "./main/Interview/feedback/FeedbackResult";
function App() {
  return (
    <Router>
      <Routes>
        {/*  공개 라우트: 인증 없이 접근 가능  */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route path="main" element={<Main />} />
          <Route path="feedbackresult" element={<FeedbackResult />} />
        </Route>

        <Route path="/interview" element={<InterviewLayout />} />
      
        <Route path="AnalyzingModal" element={<AnalyzingModal />} />
        <Route path="AssessmentIntro" element={<AssessmentIntro />} />
        <Route path="feedbackresult" element={<FeedbackResult />} />
      </Routes>
    </Router>
  );
}

export default App;
