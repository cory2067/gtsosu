import React, { useState } from "react";

import { Typography } from "antd";
import "./TourneyCard.css";

export default function TourneyCard({ divisions, code, title, description, banner, fullTitle }) {
  // No tournament has divisions for now
  const hasDivisions = !!divisions;
  const [hover, setHover] = useState(false);
  const [inTransition, setInTransision] = useState(false);

  return (
    <div
      onMouseEnter={() => {
        setHover(true);
        setInTransision(true);
        setTimeout(() => { setInTransision(false) }, 500)
      }}
      onMouseLeave={() => { setHover(false); setInTransision(false); }}
      className="TourneyCard-card"
      style={{
        backgroundImage: `linear-gradient(rgba(220, 220, 220, 0.2), rgb(12, 12, 12)), url("${banner}")`,
        backgroundPosition: "center",
        backgroundSize: "cover"
      }}>
      {
        !inTransition &&
        <Typography.Title className="TourneyCard-title">
          {hover ? fullTitle : title}
        </Typography.Title>
      }
      {hover && !inTransition && <Typography.Paragraph className="TourneyCard-description">{description}</Typography.Paragraph>}
    </div>
  );
}
