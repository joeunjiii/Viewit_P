import React, { useState } from "react";

import Sidebar from "./maincomponent/Sidebar";
import MainContent from "./maincomponent/MainContent";
import "./main.css";

function Main() {
 

  return (
    <div className="layout-container">
      <MainContent />
    </div>
  );
}

export default Main;
