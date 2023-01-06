import { Typography } from "antd";
import React, { useState, useEffect } from "react";

import { get, prettifyTourney, tokenizeTourney } from "../../../utilities";
import PastTourneyCard from "./PastTourneyCard";

import "./PastTournies.css";

export default function PastTournies() {
  const [tournies, setTournies] = useState([]);

  useEffect(() => {
    get("/api/tourneys", {}).then((res) => {
      const tourneyList = res
        .map((tourney) => {
          const tokens = tokenizeTourney(tourney.code);
          return {
            _id: tourney._id,
            fullCode: tourney.code,
            displayName: prettifyTourney(tourney.code),
            ...tokens,
          };
        })
        .filter((t) => t.code !== "test")
        .reverse()
        .sort((a, b) => b.year - a.year);

      setTournies(tourneyList);
    });
  }, []);

  // Return a list of PastTourneyCards, aligned vertically
  return (
    <div className="u-rounded-border PastTournies-container">
      <Typography className="PastTournies-title">
        <text style={{ fontWeight: 900 }}>Past</text>{" "}
        <text tyle={{ fontWeight: 900 }}>Tournaments</text>
      </Typography>
      {tournies.map((tourney) => (
        <PastTourneyCard key={tourney._id} tourney={tourney} />
      ))}
    </div>
  );
}
