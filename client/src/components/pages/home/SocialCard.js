import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Typography } from "antd";
import Text from "antd/lib/typography/Text";
import React, { useState } from "react";

import "./SocialCard.css";

/**
 * Displays a card that links to a social media page.
 */
export default function SocialCard({
  smallText,
  largeText,
  fontAwesomeIcon,
  link,
  gradientColor1,
  gradientColor2,
}) {
  return (
    <div
      className="u-rounded-border SocialCard-card"
      style={{
        background: `linear-gradient(${gradientColor1}, ${gradientColor2})`,
      }}
      onClick={() => {
        if (link) window.open(link);
      }}
    >
      <Text className="SocialCard-small-text">{smallText}</Text>
      <div className="SocialCard-second-line">
        <FontAwesomeIcon icon={fontAwesomeIcon} className="SocialCard-icon" />
        <Text className="SocialCard-large-text">{largeText}</Text>
      </div>
    </div>
  );
}
