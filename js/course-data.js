/**
 * Baangegevens Golfclub Zeegersloot - Griendbaan (Holes 1 t/m 9)
 * Alphen aan den Rijn
 */

const COURSE_INFO = (typeof window !== 'undefined' ? window.COURSE_INFO = {} : {});
Object.assign(COURSE_INFO, {
  clubName: "Golfclub Zeegersloot",
  courseName: "Griendbaan (Holes 1-9)",
  totalHoles: 9,
  par: 36,
  golfdashboardUrl: "https://zeegersloot.golfdashboard.com",
  clubWebsite: "https://zeegersloot.nl",
  
  tees: {
    wit: {
      name: "Wit",
      label: "Wit (Heren)",
      hex: "#ffffff",
      textHex: "#0f172a",
      border: "1px solid #94a3b8",
      cr: 35.8,
      sr: 132,
      totalMeters: 3017
    },
    geel: {
      name: "Geel",
      label: "Geel (Heren)",
      hex: "#eab308",
      textHex: "#0f172a",
      border: "1px solid #ca8a04",
      cr: 35.1,
      sr: 129,
      totalMeters: 2856
    },
    blauw: {
      name: "Blauw",
      label: "Blauw (Dames/Heren)",
      hex: "#3b82f6",
      textHex: "#ffffff",
      border: "1px solid #2563eb",
      cr: 33.9,
      sr: 118,
      totalMeters: 2633
    },
    rood: {
      name: "Rood",
      label: "Rood (Dames)",
      hex: "#ef4444",
      textHex: "#ffffff",
      border: "1px solid #dc2626",
      cr: 33.2,
      sr: 114,
      totalMeters: 2490
    },
    oranje: {
      name: "Oranje",
      label: "Oranje (Beginners/Jeugd)",
      hex: "#f97316",
      textHex: "#ffffff",
      border: "1px solid #ea580c",
      cr: 31.9,
      sr: 108,
      totalMeters: 2211
    }
  },

  holes: [
    {
      number: 1,
      par: 4,
      strokeIndex: 13,
      distances: { wit: 338, geel: 330, blauw: 324, rood: 290, oranje: 253 },
      description: "Rechte par 4 met water aan weerszijden van de fairway.",
      tee: { lat: 52.14502, lon: 4.69950 },
      green: { lat: 52.14787, lon: 4.69806 }
    },
    {
      number: 2,
      par: 4,
      strokeIndex: 1,
      distances: { wit: 426, geel: 359, blauw: 359, rood: 351, oranje: 282 },
      description: "Moeilijkste hole (SI 1). Lange par 4 met strategische waterhindernis.",
      tee: { lat: 52.14805, lon: 4.69750 },
      green: { lat: 52.15008, lon: 4.69721 }
    },
    {
      number: 3,
      par: 4,
      strokeIndex: 3,
      distances: { wit: 314, geel: 306, blauw: 283, rood: 279, oranje: 249 },
      description: "Par 4 in zuidelijke richting met water rechts en bunkers rond de green.",
      tee: { lat: 52.15030, lon: 4.69710 },
      green: { lat: 52.14787, lon: 4.69806 }
    },
    {
      number: 4,
      par: 5,
      strokeIndex: 7,
      distances: { wit: 471, geel: 459, blauw: 398, rood: 390, oranje: 356 },
      description: "Eerste par 5. Brede fairway met slotgracht voor de green.",
      tee: { lat: 52.14800, lon: 4.69850 },
      green: { lat: 52.15196, lon: 4.70016 }
    },
    {
      number: 5,
      par: 4,
      strokeIndex: 9,
      distances: { wit: 367, geel: 357, blauw: 302, rood: 294, oranje: 235 },
      description: "Uitdagende par 4 naar het noordelijkste punt van de baan.",
      tee: { lat: 52.15220, lon: 4.70030 },
      green: { lat: 52.15345, lon: 4.69844 }
    },
    {
      number: 6,
      par: 3,
      strokeIndex: 15,
      distances: { wit: 171, geel: 162, blauw: 153, rood: 91, oranje: 91 },
      description: "Mooie par 3 over water naar een verhoogde green.",
      tee: { lat: 52.15200, lon: 4.70090 },
      green: { lat: 52.15067, lon: 4.70109 }
    },
    {
      number: 7,
      par: 4,
      strokeIndex: 11,
      distances: { wit: 290, geel: 283, blauw: 263, rood: 258, oranje: 258 },
      description: "Kortere par 4 met water links en strategisch geplaatste bomen.",
      tee: { lat: 52.15080, lon: 4.70180 },
      green: { lat: 52.15029, lon: 4.70201 }
    },
    {
      number: 8,
      par: 3,
      strokeIndex: 17,
      distances: { wit: 168, geel: 131, blauw: 131, rood: 126, oranje: 108 },
      description: "Korte par 3 (SI 17). Precieze afslag nodig naar bewaakte green.",
      tee: { lat: 52.14920, lon: 4.70208 },
      green: { lat: 52.15029, lon: 4.70201 }
    },
    {
      number: 9,
      par: 5,
      strokeIndex: 5,
      distances: { wit: 479, geel: 469, blauw: 420, rood: 411, oranje: 379 },
      description: "Slot hole par 5 terug naar het clubhuis met water langs de rechterkant.",
      tee: { lat: 52.14905, lon: 4.70128 },
      green: { lat: 52.14539, lon: 4.70071 }
    }
  ]
});
if (typeof module !== 'undefined' && module.exports) {
  module.exports = COURSE_INFO;
}
