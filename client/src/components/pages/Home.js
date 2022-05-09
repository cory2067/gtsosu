import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TourneyCard from "../modules/TourneyCard";
import "./Home.css";

import data from "../../content/home-en";
import { Layout } from "antd";
const { Header, Content } = Layout;

export default function Home() {
  useEffect(() => {
    document.title = "GTS";
  });

  return (
    <Content className="content Home-content">
      <div className="Home-title-section">
        <div className="Home-title-section-inner">
          <h1 className="Home-title u-xbold">{data.title}</h1>
          <div className="Home-about-container">
            <div className="Home-about">
              <ReactMarkdown source={data.description} />
            </div>
          </div>
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
