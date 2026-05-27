import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import InscreverLanding from "./pages/InscreverLanding";
import InscreverForm from "./pages/InscreverForm";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/inscrever" element={<InscreverLanding />} />
      <Route path="/inscrever/:teamSlug" element={<InscreverForm />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;
