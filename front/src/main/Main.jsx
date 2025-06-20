import React from "react";
import MainContent from "./maincomponent/MainContent";
import MainHeader from "./maincomponent/MainHeader";
import "./main.css";

function Main() {
 

  return (
    <div className="main-wrapper">
      <MainHeader/>
      <MainContent />
    </div>
  );
}

export default Main;
