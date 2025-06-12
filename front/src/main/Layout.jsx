// components/Layout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./maincomponent/Sidebar";
import "./Layout.css";

function Layout({ Subcomponent }) {
  console.log("🔁 Layout 렌더링됨");
  

  return (
    <div className="layout-container">
      <Sidebar /> 
      <main className="content-area">
      <Outlet />
      </main>
    </div>
  );
}

export default Layout;
