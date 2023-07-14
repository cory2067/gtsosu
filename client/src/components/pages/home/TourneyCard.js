import React, { useState } from "react";

import { Button, Typography } from "antd";
import "./TourneyCard.css";

function redirectToTourney(code) {
  window.location.href = `/${code}/home`;
}

export default function TourneyCard({
  divisions,
  code,
  title,
  description,
  banner,
  fullTitle,
  ongoing,
}) {
  // No tournament has divisions for now
  // const hasDivisions = !!divisions;

  var ongoingClassname = ongoing ? " ongoing" : "";

  return (
    <div
      to={`/${code}/home`}
      className="u-rounded-border TourneyCard-card"
      style={{
        backgroundImage: `url("${banner}"), linear-gradient(var(--onyx-dark), var(--onyx-dark))`,
        backgroundBlendMode: "color",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
      onClick={() => redirectToTourney(code)}
    >
      <div className={`TourneyCard-container${ongoingClassname}`}>
        <div
          className={`u-rounded-border TourneyCard-banner${ongoingClassname}`}
          style={{
            backgroundImage: `url("${banner}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        <div className={`TourneyCard-content${ongoingClassname}`}>
          <Typography className={`TourneyCard-title${ongoingClassname}`}>{fullTitle}</Typography>
          <Typography.Paragraph className={`TourneyCard-description${ongoingClassname}`}>
            {description}
          </Typography.Paragraph>
          <Button className="outlined-light" onClick={() => redirectToTourney(code)} size="large">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
