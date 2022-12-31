import {
  faBandcamp,
  faDiscord,
  faTwitch,
  faTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

// Social media button informations that will be displayed in the home screen
export default [
  {
    smallText: "Listen to our",
    largeText: "Bandcamp",
    fontAwesomeIcon: faBandcamp,
    gradientColor1: "rgba(27, 159, 194, 0.5)",
    gradientColor2: "rgba(27, 159, 194, 0.25)",
    link: "https://gtsosu.bandcamp.com/",
  },
  {
    smallText: "Find us on",
    largeText: "Twitter",
    fontAwesomeIcon: faTwitter,
    gradientColor1: "rgba(29, 161, 242, 0.5)",
    gradientColor2: "rgba(29, 161, 242, 0.25)",
    link: "https://twitter.com/GTSosu",
  },
  {
    smallText: "Join our",
    largeText: "Discord Server",
    fontAwesomeIcon: faDiscord,
    gradientColor1: "rgba(99, 112, 244, 0.5)",
    gradientColor2: "rgba(99, 112, 244, 0.25)",
    link: "https://discord.gg/3mGC3HB",
  },
  {
    smallText: "Check out our",
    largeText: "Twitch Channel",
    fontAwesomeIcon: faTwitch,
    gradientColor1: "rgba(141, 68, 247, 0.5)",
    gradientColor2: "rgba(141, 68, 247, 0.25)",
    link: "https://twitch.tv/gtsosu",
  },
  {
    smallText: "Have a look at our",
    largeText: "Youtube Channel",
    fontAwesomeIcon: faYoutube,
    gradientColor1: "rgba(255, 0, 0, 0.5)",
    gradientColor2: "rgba(255, 0, 0, 0.25)",
    link: "https://www.youtube.com/channel/UCuAkgxBGhYAZ7txDsHrNz0w",
  },
];
