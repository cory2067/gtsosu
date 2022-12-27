import React, { useState } from "react";

import { Button, Typography } from "antd";
import "./TourneyCard.css";
import { Link } from "@reach/router";
import Text from "antd/lib/typography/Text";

function redirectToTourney() {
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
  const hasDivisions = !!divisions;
  const [hover, setHover] = useState(false);
  const [inTransition, setInTransision] = useState(false);

  const overlayLightOpacity = hover ? 0.05 : 0.2;

  return (
    <div
      to={`/${code}/home`}
      className="TourneyCard-card"
      style={{
        backgroundImage: `url("${banner}"), linear-gradient(var(--onyx-dark), var(--onyx-dark))`,
        backgroundBlendMode: "color",
        backgroundPosition: "center",
        backgroundSize: "160%",
      }}
      onClick={redirectToTourney}
    >
      <div
        className="TourneyCard-container"
        style={{
          flexDirection: ongoing ? "row-reverse" : "column",
        }}
      >
        <div
          className={"TourneyCard-banner"}
          style={{
            backgroundImage: `url("${banner}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            // The 100px width here is just to
            width: ongoing ? "100px" : "100%",
            height: ongoing ? "auto" : "290px",
            flexGrow: ongoing ? 0.7 : 0,
          }}
        />
        <div
          className={"TourneyCard-content"}
          style={{
            width: ongoing ? "100px" : "auto",
            flexGrow: ongoing ? 0.3 : 0,
          }}
        >
          <Typography.Title
            className="TourneyCard-title"
            style={{
              fontSize: ongoing ? "40px" : "33px",
              fontStyle: "italic",
              fontWeight: 900,
            }}
          >
            {fullTitle}
          </Typography.Title>
          <Typography.Paragraph
            className="TourneyCard-description"
            style={{
              fontSize: ongoing ? "24px" : "20px",
            }}
          >
            {description}
          </Typography.Paragraph>
          <Button onClick={redirectToTourney} size="large">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
