import { Image, Typography } from "antd";
import Text from "antd/lib/typography/Text";
import React, { useState, useEffect } from "react";

import ContentManager from "../../../ContentManager";

import "./PastTourneyCard.css";

/**
 * @typedef tourney
 * @property {string} displayName
 * @property {string} code
 * @property {number} year
 * @property {string} codeAndDivision
 */
/**
 * @param {object} props
 * @param {tourney} props.tourney
 */
export default function PastTourneyCard({ tourney }) {
  const [tourneyContent, SetTourneyContent] = useState(null);

  useEffect(() => {
    ContentManager.get(tourney.fullCode).then((content) => {
      SetTourneyContent(content);
    });
  }, [tourney.codeAndDivision]);

  return (
    <div className="u-rounded-border PastTourneyCard-container">
      <Image
        className="u-rounded-border PastTourneyCard-thumbnail"
        src="TODO: banner url"
        fallback="/public/gts-tournament-no-image.png"
      />
      <div className="PastTourneyCard-text-container">
        <Typography className="PastTourneyCard-title">
          <Text className="u-xxbold">{tourneyContent?.name || "..."}</Text>
          <Text> {tourney?.year}</Text>
        </Typography>
        <Typography.Paragraph ellipsis={{ rows: 3 }} className="PastTourneyCard-description">
          {tourneyContent?.description || "..."}
        </Typography.Paragraph>
      </div>
    </div>
  );
}
