import React from "react";

import stripesBottomLeft from "./svg/stripes-bottom-left.svg";
import stripesTopRight from "./svg/stripes-top-right.svg";
import stripedCircleWhite from "./svg/striped-circle-white.svg";
import stripedCircleOrange from "./svg/striped-circle-orange.svg";

// import gtsLogo from "../../../public/gts-osu.svg";

import "./HomeBanner.css";
import { Button, Typography } from "antd";
import { useMatchMedia } from "../../../utilities";

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

function LoginButtons() {
  return (
    <div className="HomeBanner-login-buttons-container">
      <Button type="primary" size="large">
        Login
      </Button>
      <Button size="large">Learn More</Button>
    </div>
  );
}

export default function HomeBanner() {
  var mobileLayout = useMatchMedia("(max-width: 1000px)")?.matches;

  return (
    <div className="HomeBanner-container">
      <HomeBannerBackground />
      <div className="HomeBanner-section-1">
        <div className="HomeBanner-section-1-inner">
          <div className="u-flexRow u-flex-alignCenter">
            <img src="public/gts-osu.svg" className="HomeBanner-logo" />
            <Typography className="HomeBanner-title">GLOBAL TAIKO SHOWDOWN</Typography>
          </div>
          <Typography className="HomeBanner-description">
            Text go here talking about it, bla bla bla, random cool text, uwu, it's cool here, i
            like this text
          </Typography>
          {!mobileLayout && LoginButtons()}
        </div>
      </div>
      <div className="HomeBanner-section-2">
        <video autoPlay loop muted className="HomeBanner-media">
          <source src="/public/banner.mp4" type="video/mp4" />
        </video>
        {mobileLayout && LoginButtons()}
      </div>
    </div>
  );
}
