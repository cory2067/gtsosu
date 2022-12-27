import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TourneyCard from "../modules/TourneyCard";
import "./Home.css";

import data from "../../content/home-en";
import { Col, Layout, Row } from "antd";
const { Header, Content } = Layout;

function organizeIntoGrid(tournies) {
  var tourneyGrid = [];

  for (var i = 0; i < tournies.length; i += 2) {
    var row = tournies.slice(i, i + 2);
    tourneyGrid.push(row);
  }

  return tourneyGrid;
}

export default function Home() {
  useEffect(() => {
    document.title = "GTS";
  });

  var ongoingTournies = data.tournies.filter((tourney) => tourney.ongoing);
  var tournies = data.tournies.filter((tourney) => !tourney.ongoing);

  return (
    <Content className="content Home-content">
      {/* <div className="Home-title-section">
        <div className="Home-title-section-inner">
          <h1 className="Home-title u-xbold">{data.title}</h1>
          <div className="Home-about-container">
            <div className="Home-about">
              <ReactMarkdown source={data.description} />
            </div>
          </div>
        </div>
      </div> */}

      <div className="Home-container">
        {ongoingTournies.map((tourney) => (
          <TourneyCard key={tourney.code} {...tourney} />
        ))}
        {organizeIntoGrid(tournies).map((row, i) => {
          return (
            <Row key={i.toString()} gutter={[0, 0]} align="stretch">
              {row.map((tourney) => {
                return (
                  <Col span={12}>
                    <TourneyCard key={tourney.code} {...tourney} />
                  </Col>
                );
              })}
            </Row>
          );
        })}
      </div>
    </Content>
  );
}
