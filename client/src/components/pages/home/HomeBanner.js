import React from "react";

import stripesBottomLeft from "./svg/stripes-bottom-left.svg";
import stripesTopRight from "./svg/stripes-top-right.svg";
import stripedCircleWhite from "./svg/striped-circle-white.svg";
import stripedCircleOrange from "./svg/striped-circle-orange.svg";

import "./HomeBanner.css";

function HomeBannerBackground() {
  return (
    <div className="u-rounded-border HomeBannerBackground-container">
      <img src={stripesBottomLeft} className="HomeBannerBackground-stripes-left" />
      <img src={stripesTopRight} className="HomeBannerBackground-stripes-right" />
      <img src={stripedCircleWhite} className="HomeBannerBackground-striped-circle-white" />
      <img src={stripedCircleOrange} className="HomeBannerBackground-striped-circle-orange" />
    </div>
  );
}

export default function HomeBanner() {
  return (
    <div className="u-rounded-border HomeBanner-container">
      <HomeBannerBackground />
    </div>
  );
}
