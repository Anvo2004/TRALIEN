const DANANG_AI_URL = "https://danangai.1022.vn/";

function prepareMiniAppLinks(items) {
  return items
    .filter((item) => !(item.section === "quick_link" && ["/dan-so", "/thon-xom"].includes(item.path)))
    .map((item) => item.path === "/tro-ly-so" ? {
      ...item,
      href: DANANG_AI_URL,
      path: "",
      description: "Trợ lý số DaNang AI",
      badge: "",
    } : item);
}

module.exports = { DANANG_AI_URL, prepareMiniAppLinks };
