import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TourneyCard from "./TourneyCard";
import SocialCard from "./SocialCard";
import "./Home.css";

import data from "../../../content/home-en";
import socials from "../../../content/socials";
import { Col, Layout, Row } from "antd";
import PastTournies from "./PastTournies";
import { useMatchMedia } from "../../../utilities";
import Text from "antd/lib/typography/Text";
import HomeBanner from "./HomeBanner";
const { Header, Content } = Layout;

function organizeIntoGrid(tournies, columns = 2) {
  var tourneyGrid = [];

  for (var i = 0; i < tournies.length; i += columns) {
    var row = tournies.slice(i, i + columns);
    tourneyGrid.push(row);
  }

  return tourneyGrid;
}

export default function Home() {
  useEffect(() => {
    document.title = "GTS";
  });

  var mobileLayout = useMatchMedia("(max-width: 1280px)")?.matches;
  var tourneyColSpan = mobileLayout ? 24 : 12;
  var ongoingTournies = data.tournies.filter((tourney) => tourney.ongoing);
  var tournies = data.tournies.filter((tourney) => !tourney.ongoing);
  const currentTourniesFullCode = data.tournies.map((tourney) => tourney.fullCode);

  return (
    <Content className="content Home-content">
      {/* <div className="Home-title-section">
        <div className="Home-title-section-inner">
          <h1 className="Home-title u-bold">{data.title}</h1>
          <div className="Home-about-container">x
            <div className="Home-about">
              <ReactMarkdown source={data.description} />
            </div>
          </div>
        </div>
      </div> */}

      <div className="Home-container">
        {/* Banner */}
        <HomeBanner />

        {/* Ongoing tournies */}
        {ongoingTournies.map((tourney) => (
          <TourneyCard key={tourney.code} {...tourney} />
        ))}

        {/* Other tournies */}
        {organizeIntoGrid(tournies, mobileLayout ? 1 : 2).map((row, i) => {
          return (
            <Row key={i.toString()} gutter={[0, 0]} align="stretch">
              {row.map((tourney) => {
                return (
                  <Col span={tourneyColSpan} key={tourney.code}>
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
          <PastTournies exclude={currentTourniesFullCode} />
        </div>
      </div>
    </Content>
  );
}
