// components/ScreenSizeGuard.jsx
import React, { useEffect, useState } from "react";
import ResizeAlertModal from "./ResizeAlertModal"; // 위에서 만든 안내창

const MIN_WIDTH = 1500;
const MIN_HEIGHT = 600;

export default function ScreenSizeGuard({ children }) {
    const [tooSmall, setTooSmall] = useState(false);

    useEffect(() => {
        const checkSize = () => {
            console.log("현재 크기:", window.innerWidth, window.innerHeight);
            setTooSmall(
                window.innerWidth < MIN_WIDTH || window.innerHeight < MIN_HEIGHT
            );
        };
        checkSize();
        window.addEventListener("resize", checkSize);
        return () => window.removeEventListener("resize", checkSize);
    }, []);

    if (tooSmall) return <ResizeAlertModal />;

    return <>{children}</>;
}
