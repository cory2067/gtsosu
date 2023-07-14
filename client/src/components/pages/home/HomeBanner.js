import React from "react";

import ContentManager from "../../../ContentManager";
import Content from "../../../content/home-en";
import { get } from "../../../utilities";

import stripesBottomLeft from "./svg/stripes-bottom-left.svg";
import stripesTopRight from "./svg/stripes-top-right.svg";
import stripedCircleWhite from "./svg/striped-circle-white.svg";
import stripedCircleOrange from "./svg/striped-circle-orange.svg";

import "./HomeBanner.css";
import { Button, Typography } from "antd";
import { useMatchMedia } from "../../../utilities";

const UI = ContentManager.getUI();

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

/**
 * @typedef {LoginProps} HomeBannerProps
 */
/**
 * @param {HomeBannerProps} props
 */
export default function HomeBanner({ user, setUser }) {
  return (
    <div className="HomeBanner-container">
      <HomeBannerBackground />
      <div className="HomeBanner-section-1">
        <div className="HomeBanner-section-1-inner">
          <div className="u-flexRow u-flex-alignCenter">
            <img src="public/gts-osu.svg" className="HomeBanner-logo" />
            <Typography className="HomeBanner-title">GLOBAL TAIKO SHOWDOWN</Typography>
          </div>
          <Typography className="HomeBanner-description">{Content.description}</Typography>
        </div>
      </div>
      <div className="HomeBanner-section-2">
        <iframe
          className="HomeBanner-media"
          src={`https://www.youtube.com/embed/${Content.bannerVideoID}?autoplay=1&showinfo=0&controls=0&autohide=1&mute=1&loop=1&playlist=${Content.bannerVideoID}`}
          title="COEGTS 2023"
          frameborder="0"
          controls="0"
          allow="autoplay;"
        ></iframe>
      </div>
    </div>
  );
}
