import React, { useState } from "react";

import { Typography } from "antd";
import "./TourneyCard.css";
import { Link } from "@reach/router";

export default function TourneyCard({ divisions, code, title, description, banner, fullTitle }) {
  // No tournament has divisions for now
  const hasDivisions = !!divisions;
  const [hover, setHover] = useState(false);
  const [inTransition, setInTransision] = useState(false);

  const overlayLightOpacity = hover ? 0.05 : 0.2;

  return (
    <Link
      to={`/${code}/home`}
      onMouseEnter={() => {
        setHover(true);
        setInTransision(true);
        setTimeout(() => {
          setInTransision(false);
        }, 400);
      }}
      onMouseLeave={() => {
        setHover(false);
        setInTransision(false);
      }}
      className="TourneyCard-card"
      style={{
        backgroundImage: `linear-gradient(rgba(12, 12, 12, ${overlayLightOpacity}), rgb(12, 12, 12)), url("${banner}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      {!inTransition && (
        <Typography.Title className="TourneyCard-title">
          {hover ? fullTitle : title}
        </Typography.Title>
      )}
      {hover && !inTransition && (
        <Typography.Paragraph className="TourneyCard-description">
          {description}
        </Typography.Paragraph>
      )}
    </Link>
  );
}
