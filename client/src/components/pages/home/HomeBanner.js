import React from "react";

import ContentManager from "../../../ContentManager";
import { get } from "../../../utilities";

import stripesBottomLeft from "./svg/stripes-bottom-left.svg";
import stripesTopRight from "./svg/stripes-top-right.svg";
import stripedCircleWhite from "./svg/striped-circle-white.svg";
import stripedCircleOrange from "./svg/striped-circle-orange.svg";

// import gtsLogo from "../../../public/gts-osu.svg";

import "./HomeBanner.css";
import { Button, Typography } from "antd";
import { useMatchMedia } from "../../../utilities";

const UI = ContentManager.getUI();

/**
 * @typedef {Object} LoginProps
 *
 * @property {Object} user
 * @property {Function} setUser
 */
/**
 * Opens a popup window to osu! OAuth login.
 * This is copied from LoginButton.js
 *
 * @param {LoginProps} props
 */
async function login({ user, setUser }) {
  if (user.username) {
    await fetch("/auth/logout");
    setUser({});
    return;
  }

  const width = 600;
  const height = 600;
  const left = window.innerWidth / 2 - width / 2;
  const top = window.innerHeight / 2 - height / 2;

  const popup = window.open(
    "/auth/login/",
    "",
    `toolbar=no, location=no, directories=no, status=no, menubar=no,
    scrollbars=no, resizable=no, copyhistory=no, width=${width},
    height=${height}, top=${top}, left=${left}`
  );

  // Not sure why but onclose doesn't work
  const loop = setInterval(async () => {
    if (popup.closed) {
      clearInterval(loop);
      const userData = await get("/api/whoami");
      setUser(userData);
    }
  }, 50);
  return loop;
}

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
 * @param {LoginProps} props
 */
function LoginButtons({ user, setUser }) {
  return (
    <div className="HomeBanner-login-buttons-container">
      <Button
        className="cta"
        size="large"
        onClick={() => {
          login({ user, setUser });
        }}
      >
        {user?.username ? UI.logout : UI.login}
      </Button>
      <Button className="outlined-light" size="large">
        Learn More
      </Button>
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
          {!mobileLayout && LoginButtons({ user, setUser })}
        </div>
      </div>
      <div className="HomeBanner-section-2">
        <video autoPlay loop muted className="HomeBanner-media">
          <source src="/public/banner.mp4" type="video/mp4" />
        </video>
        {mobileLayout && LoginButtons({ user, setUser })}
      </div>
    </div>
  );
}
