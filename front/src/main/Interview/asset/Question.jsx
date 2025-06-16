import React from "react";

function Question({ number, text }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <div>
        <h2>{`Q${number}`}</h2>
        <p>{text}</p>
      </div>
      
    </div>
  );
}

export default Question;
