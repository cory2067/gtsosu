import { Typography } from "antd";
import Text from "antd/lib/typography/Text";
import React, { useEffect, useState } from "react";

import { get, prettifyTourney, tokenizeTourney } from "../../../utilities";
import PastTourneyCard from "./PastTourneyCard";

import "./PastTournies.css";

/**
 * @typedef PastTourniesProps
 * @property {String[]} exclude Tournies full code to exclude from the list
 */
/**
 * @param {PastTourniesProps} param0
 * @returns
 */
export default function PastTournies({ exclude }) {
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
        <Text style={{ fontWeight: 900 }}>Past</Text>{" "}
        <Text tyle={{ fontWeight: 900 }}>Tournaments</Text>
      </Typography>
      {tournies
        .filter((t) => !exclude.includes(t.fullCode))
        .map((tourney) => (
          <PastTourneyCard key={tourney._id} tourney={tourney} />
        ))}
    </div>
  );
}
