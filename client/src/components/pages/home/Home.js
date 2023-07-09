import React, { useEffect } from "react";
import TourneyCard from "./TourneyCard";
import SocialCard from "./SocialCard";
import "./Home.css";

import data from "../../../content/home-en";
import socials from "../../../content/socials";
import { Col, Layout, Row } from "antd";
import PastTournies from "./PastTournies";
import { useMatchMedia } from "../../../utilities";
import HomeBanner from "./HomeBanner";
const { Content } = Layout;

function organizeIntoGrid(tournies, columns = 2) {
  var tourneyGrid = [];

  for (var i = 0; i < tournies.length; i += columns) {
    var row = tournies.slice(i, i + columns);
    tourneyGrid.push(row);
  }

  return tourneyGrid;
}

/**
 * @param {import("./HomeBanner").HomeBannerProps} props
 */
export default function Home({ user, setUser }) {
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
      <div className="Home-container">
        {/* Banner */}
        <HomeBanner user={user} setUser={setUser} />

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
