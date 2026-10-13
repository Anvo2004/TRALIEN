import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import "zmp-ui/zaui.css";
import "./css/app.scss";
import "./css/ns.css";
import "./css/ns-legacy.css";

createRoot(document.getElementById("app")).render(<App />);
