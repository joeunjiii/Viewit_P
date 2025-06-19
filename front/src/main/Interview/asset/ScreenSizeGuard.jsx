// components/ScreenSizeGuard.jsx
import React, { useEffect, useState } from "react";
import ResizeAlertModal from "./ResizeAlertModal"; // 위에서 만든 안내창

const MIN_WIDTH = 1500;
const MIN_HEIGHT = 600;

export default function ScreenSizeGuard() {
    const [tooSmall, setTooSmall] = useState(false);

    useEffect(() => {
        const checkSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isTooSmall = width < MIN_WIDTH || height < MIN_HEIGHT;
           
            setTooSmall(isTooSmall);
        };
        checkSize();
        window.addEventListener("resize", checkSize);
        return () => window.removeEventListener("resize", checkSize);
    }, []);

    if (!tooSmall) return null;

    return (
        <div style={{
          position: "fixed", zIndex: 9999, left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(255,255,255,0.82)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <ResizeAlertModal />
        </div>
      );
}
