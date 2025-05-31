import express from "express";
import passport from "passport";
import fetch from "node-fetch";
import passportOAuth2 from "passport-oauth2";
import User from "./models/user";
import { UserDocument, Request, BaseRequestArgs, DiscordAccount } from "./types";

const OAuth2Strategy = passportOAuth2.Strategy;

const router = express.Router();

// Perform post-processing on the user object at login time, like overrides for dev
const finalize = async (user: UserDocument) => {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_ADMIN) {
    user.admin = process.env.DEV_ADMIN === "true";
    await user.save();
  }
  return user;
};

const makeAuthStrategy = (clientId: string, clientSecret: string) =>
  new OAuth2Strategy(
    {
      authorizationURL: "https://osu.ppy.sh/oauth/authorize",
      tokenURL: "https://osu.ppy.sh/oauth/token",
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: "/auth/osu/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const me = await fetch("https://osu.ppy.sh/api/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((res) => res.json());

      const existing = await User.findOne({ userid: me.id });
      if (existing) {
        if (existing.username !== me.username) {
          // if user had a namechange, update the db entry
          existing.username = me.username;
          await existing.save();
        }

        return done(null, await finalize(existing));
      }

      const user = new User({
        username: me.username,
        userid: me.id,
        country: me.country_code,
        avatar: me.avatar_url,
        discord: me.discord || "",
      });
      await user.save();
      done(null, await finalize(user));
    }
  );

const makeAuthStrategyDiscord = (clientId: string, clientSecret: string) =>
  new OAuth2Strategy(
    {
      authorizationURL: "https://discord.com/api/oauth2/authorize",
      tokenURL: "https://discord.com/api/oauth2/token",
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: "/auth/discord/callback",
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const me = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((res) => res.json());

      done(null, me);
    }
  );

const getStrategy = (req) => (req.hostname === "taikotourney.com" ? "taikotourney" : "default");

if (process.env.NODE_ENV !== "test") {
  passport.use("default", makeAuthStrategy(process.env.CLIENT_ID!, process.env.CLIENT_SECRET!));

  // Need separate oauth id/secret for taikotourney.com domain
  if (process.env.TT_CLIENT_ID && process.env.TT_CLIENT_SECRET) {
    passport.use(
      "taikotourney",
      makeAuthStrategy(process.env.TT_CLIENT_ID, process.env.TT_CLIENT_SECRET)
    );
  }

  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(
      "discord",
      makeAuthStrategyDiscord(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET)
    );
  }

  passport.serializeUser((user: UserDocument, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
  });

  router.get("/login", (req, res) => passport.authenticate(getStrategy(req))(req, res));

  // TODO: for some reason ts explodes in prod here, overriding to `any` for now
  router.get("/logout", (req: any, res) => {
    req.logout();
    res.redirect("/");
  });

  router.get(
    "/osu/callback",
    (req, res, next) =>
      passport.authenticate(getStrategy(req), { failureRedirect: "/login" })(req, res, next),
    (req, res) => {
      // Successful authentication!
      // janky thing to close the login popup window
      res.send("<script>setInterval(window.close)</script>");
    }
  );

  router.get("/login-discord", (req, res) => passport.authorize("discord")(req, res));

  router.get(
    "/discord/callback",
    (req, res, next) =>
      passport.authorize("discord", { failureRedirect: "/login-discord" })(req, res, next),
    async (req: Request<BaseRequestArgs, BaseRequestArgs>, res) => {
      if (req.user && req.account) {
        // Associate discord account with logged-in user
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            discordId: req.account.id,
            discord: getFullDiscordUsername(req.account),
          },
        });
      }

      // Successful authentication!
      // janky thing to close the login popup window
      res.send("<script>setInterval(window.close)</script>");
    }
  );
}

function getFullDiscordUsername(account: DiscordAccount): string {
  if (account.discriminator && account.discriminator !== "0") {
    return `${account.username}#${account.discriminator}`;
  }
  return account.username;
}

export default router;
