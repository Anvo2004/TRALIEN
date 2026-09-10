import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import "zmp-ui/zaui.css";
import "./css/app.scss";

createRoot(document.getElementById("app")).render(<App />);
