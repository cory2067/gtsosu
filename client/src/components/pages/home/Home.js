import React, { useEffect } from "react";
import "./Home.css";
import SocialCard from "./SocialCard";
import TourneyCard from "./TourneyCard";

import data from "../../../content/home-en";
import socials from "../../../content/socials";
import HomeBanner from "./HomeBanner";
import PastTournies from "./PastTournies";

/**
 * @typedef HomeProps
 * @property {Object} user
 * @property {(user: Object) => void} setUser
 */
/**
 * @param {HomeProps} props
 */
export default function Home({ user, setUser }) {
  useEffect(() => {
    document.title = "GTS";
  });

  const ongoingTournies = data.tournies.filter((tourney) => tourney.ongoing);
  const tournies = data.tournies.filter((tourney) => !tourney.ongoing);
  const currentTourniesFullCode = data.tournies.map((tourney) => tourney.fullCode);

  return (
    <div className="content Home-content">
      <div className="Home-container">
        {/* Banner */}
        <HomeBanner user={user} setUser={setUser} />

        {/* Ongoing tournies */}
        {ongoingTournies.map((tourney) => (
          <TourneyCard key={tourney.code} {...tourney} />
        ))}

        <div className="Home-tourney-grid-container">
          {tournies.map((tourney) => (
            <TourneyCard {...tourney} />
          ))}
        </div>

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
    </div>
  );
}
