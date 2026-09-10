import React from "react";
import { Page, Header, Box } from "zmp-ui";
import NewsCard from "../components/news-card.jsx";
import useNews from "../data/use-news.js";

const NewsPage = () => {
  const news = useNews();
  const [firstNews, ...restNews] = news;

  return (
    <Page className="page-news">
      <Header title="Tin tức" />
      <Box className="section section--first">
        <div className="news-list">
          {firstNews && <NewsCard item={firstNews} featured />}
          {restNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </Box>
    </Page>
  );
};

export default NewsPage;
