import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TourneyCard from "../modules/TourneyCard";
import "../../utilities.css";
import "./Home.css";

import data from "../../content/home-en";
import { Layout } from "antd";
const { Content } = Layout;

export default function Home() {
  useEffect(() => {
    document.title = "GTS";
  });

  return (
    <Content className="content">
      <h1 className="Home-title">{data.title}</h1>
      <div className="Home-about-container">
        <div className="Home-about">
          <ReactMarkdown source={data.description} />
        </div>
      </div>

      <div className="Home-container">
        {data.tournies.map((tourney) => (
          <TourneyCard key={tourney.code} {...tourney} />
        ))}
      </div>
    </Content>
  );
}
