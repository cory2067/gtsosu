export default {
  title: "Global Taiko Showdown",
  description: "Welcome to the website of one of the biggest osu!taiko tournament series!",
  tournies: [
    {
      title: "EGTS",
      code: "egts",
      description: `
The Expert Global Taiko Showdown, which is our 1v1 tournament targeted towards top players, even though it has no rank limit. 
The top 64 of it after qualifiers will face-off in a group stage, followed by a heated double-elimination bracket. Next edition will be released on September 5th.`,
    },
    {
      title: "IGTS",
      code: "igts",
      description: `
The Intermediate Global Taiko Showdown, the founding tournament of this series.
It's our 2v2 tournament for intermediate level players being restricted for ranks #3,500 to #10,000. 
The teams will first play in a qualifiers. The top 32 teams will then play in a Group Stage where 16 teams will go through and play in a double-elimination bracket.`,
    },
    {
      title: "AGTS",
      code: "agts",
      description: `
The Advanced Global Taiko Showdown, our 2v2 tournament for advanced-level players, being restricted for ranks #500 to #3,500. 
The top 32 teams after qualifiers will then face off in a Group Stage, where 8 teams will go through, and play in a double-elimination bracket.`,
    },
    {
      title: "BGTS",
      code: "bgts",
      description: `
The Beginners Global Taiko Showdown, our 2v2 tournament for beginner players, being restricted for ranks #8,000 to no bottom rank limit.
The top 16 teams after qualifiers will then face off in a Group Stage, where 8 teams will go through, and play in a double-elimination bracket.`,
    },
    {
      title: "CGTS",
      code: "cgts",
      divisions: [
        { title: "4v4", code: "4v4" },
        { title: "Asia", code: "asia" },
        { title: "Europe", code: "eu" },
        { title: "North America", code: "na" },
        { title: "Oceania / Southeast Asia", code: "osea" },
        { title: "South America", code: "sa" },
      ],
      description: `
The Continental Global Taiko Showdown, our 1v1 tournament with no rank limit, for 5 different regions all at once, for which the top 8 of each then goes to a 4v4 tournament double-elimination bracket.
The top 32 players after qualifiers in the 1v1 tournaments will then face off in a double-elimination bracket.`,
},
  ],
};

