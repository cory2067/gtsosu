import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TourneyCard from "./TourneyCard";
import SocialCard from "./SocialCard";
import "./Home.css";

import data from "../../../content/home-en";
import socials from "../../../content/socials";
import { Col, Layout, Row } from "antd";
import PastTournies from "./PastTournies";
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
        {/* Ongoing tournies */}
        {ongoingTournies.map((tourney) => (
          <TourneyCard key={tourney.code} {...tourney} />
        ))}

        {/* Other tournies */}
        {organizeIntoGrid(tournies).map((row, i) => {
          return (
            <Row key={i.toString()} gutter={[0, 0]} align="stretch">
              {row.map((tourney) => {
                return (
                  <Col span={12} key={tourney.code}>
                    <TourneyCard {...tourney} />
                  </Col>
                );
              })}
            </Row>
          );
        })}

        {/* Socials */}
        <div className="Home-socials-container">
          {socials.map((item) => (
            <SocialCard key={item.link} {...item} />
          ))}
        </div>

        {/* Past Tournies */}
        <div className="Home-past-tournies-container">
          <PastTournies />
        </div>
      </div>
    </Content>
  );
}
