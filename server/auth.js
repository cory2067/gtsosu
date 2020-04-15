const express = require("express");
const passport = require("passport");
const logger = require("pino")();
const fetch = require("node-fetch");
const OAuth2Strategy = require("passport-oauth2").Strategy;

const router = express.Router();
const User = require("./models/user");
const prod = process.env.NODE_ENV === "production";

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://osu.ppy.sh/oauth/authorize",
      tokenURL: "https://osu.ppy.sh/oauth/token",
      clientID: prod ? process.env.PROD_CLIENT_ID : process.env.DEV_CLIENT_ID,
      clientSecret: prod ? process.env.PROD_CLIENT_SECRET : process.env.DEV_CLIENT_SECRET,
      callbackURL: "/auth/osu/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const me = await fetch("https://osu.ppy.sh/api/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((res) => res.json());

      const existing = await User.findOne({ userid: me.id });
      if (existing) {
        return done(null, existing);
      }

      const user = new User({
        username: me.username,
        userid: me.id,
        country: me.country_code,
        avatar: me.avatar_url,
      });
      await user.save();
      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

router.get("/login", passport.authenticate("oauth2"));
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get(
  "/osu/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

module.exports = router;
