import React from "react";

import Content from "../../../content/home-en";

import stripedCircleOrange from "./svg/striped-circle-orange.svg";
import stripedCircleWhite from "./svg/striped-circle-white.svg";
import stripesBottomLeft from "./svg/stripes-bottom-left.svg";
import stripesTopRight from "./svg/stripes-top-right.svg";

import { Typography } from "antd";
import "./HomeBanner.css";

function HomeBannerBackground() {
  return (
    <div className="HomeBannerBackground-container">
      <img src={stripesBottomLeft} className="HomeBannerBackground-stripes-left" />
      <img src={stripesTopRight} className="HomeBannerBackground-stripes-right" />
      <img src={stripedCircleWhite} className="HomeBannerBackground-striped-circle-white" />
      <img src={stripedCircleOrange} className="HomeBannerBackground-striped-circle-orange" />
    </div>
  );
}

export default function HomeBanner() {
  return (
    <div className="HomeBanner-container">
      <HomeBannerBackground />
      <div className="HomeBanner-section-1">
        <div className="HomeBanner-section-1-inner">
          <div className="u-flexRow u-flex-alignCenter">
            <img src="public/gts-osu.svg" className="HomeBanner-logo" />
            <Typography className="HomeBanner-title">GLOBAL TAIKO SHOWDOWN / GRATIA PRODUCTIONS</Typography>
          </div>
          <Typography className="HomeBanner-description">{Content.description}</Typography>
        </div>
      </div>
      <div className="HomeBanner-section-2">
        <iframe
          className="HomeBanner-media"
          src={`https://www.youtube.com/embed/${Content.bannerVideoID}?autoplay=1&showinfo=0&controls=0&autohide=1&mute=1&loop=1&playlist=${Content.bannerVideoID}`}
          title="EGTS 2025"
          controls="0"
          allow="autoplay;"
        ></iframe>
      </div>
    </div>
  );
}
