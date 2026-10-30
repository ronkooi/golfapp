/**
 * WHS Handicap & Stableford berekeningen
 * Specifiek afgestemd op de 9-holes Griendbaan van Golfclub Zeegersloot
 */

const COURSE_DATA = typeof COURSE_INFO !== 'undefined' 
  ? COURSE_INFO 
  : (typeof window !== 'undefined' && window.COURSE_INFO 
      ? window.COURSE_INFO 
      : (typeof require !== 'undefined' ? require('./course-data.js') : {}));

const HandicapCalculator = (typeof window !== 'undefined' ? window.HandicapCalculator = {} : {});
Object.assign(HandicapCalculator, {
  /**
   * Bereken 9-holes Playing Handicap (Baanhandicap)
   * Formule WHS 9-holes:
   * (Handicap / 2) * (Slope Rating / 113) + (Course Rating - Par)
   */
  calculatePlayingHandicap(whsHandicap, teeKey) {
    if (whsHandicap === null || whsHandicap === undefined || isNaN(whsHandicap)) {
      return 0;
    }
    const tee = COURSE_DATA.tees[teeKey] || COURSE_DATA.tees.geel;
    const halfHcp = whsHandicap / 2.0;
    const rawPhcp = (halfHcp * (tee.sr / 113.0)) + (tee.cr - COURSE_DATA.par);
    return Math.round(rawPhcp);
  },

  /**
   * Bepaal hoeveel slagen een speler meekrijgt op een specifieke hole
   * Op de Griendbaan zijn de Stroke Indexes oneven: 1, 3, 5, 7, 9, 11, 13, 15, 17.
   * Rangorde van moeilijkheid (1 t/m 9):
   * SI 1 -> rang 1, SI 3 -> rang 2, SI 5 -> rang 3, ..., SI 17 -> rang 9
   */
  getStrokesReceived(holeStrokeIndex, playingHandicap) {
    if (!playingHandicap || isNaN(playingHandicap) || playingHandicap === 0) {
      return 0;
    }
    
    // Rang 1 t/m 9 bepalen
    const rank = Math.floor((holeStrokeIndex + 1) / 2);
    
    if (playingHandicap > 0) {
      const baseStrokes = Math.floor(playingHandicap / 9);
      const remainder = playingHandicap % 9;
      return baseStrokes + (rank <= remainder ? 1 : 0);
    } else {
      // Plus-handicap (min-slagen inleveren op de makkelijkste holes)
      const absHcp = Math.abs(playingHandicap);
      const baseDeduction = Math.floor(absHcp / 9);
      const remainder = absHcp % 9;
      // Inleveren begint bij de makkelijkste hole (rang 9 = SI 17, rang 8 = SI 15, etc.)
      const reverseRank = 10 - rank;
      const extraDeduction = reverseRank <= remainder ? 1 : 0;
      return -(baseDeduction + extraDeduction);
    }
  },

  /**
   * Bereken Netto score voor een hole
   */
  calculateNetScore(strokes, strokesReceived) {
    if (strokes === null || strokes === undefined || strokes === '' || isNaN(strokes)) {
      return null;
    }
    const numStrokes = parseInt(strokes, 10);
    if (numStrokes <= 0) return null; // Pickup / streep
    return numStrokes - strokesReceived;
  },

  /**
   * Bereken Stableford punten voor een hole
   */
  calculateStableford(strokes, par, strokesReceived) {
    if (strokes === null || strokes === undefined || strokes === '' || isNaN(strokes)) {
      return 0;
    }
    const numStrokes = parseInt(strokes, 10);
    if (numStrokes <= 0) return 0; // Streep = 0 punten
    
    const net = numStrokes - strokesReceived;
    // Par met netto par geeft 2 punten; netto birdie 3, etc.
    const points = par - net + 2;
    return Math.max(0, points);
  },

  /**
   * Bepaal de scorebadge en classificatie t.o.v. Par (Bruto of Netto)
   */
  getScoreBadge(strokes, par, strokesReceived = 0, isNet = false) {
    if (!strokes || strokes <= 0) return { label: "Streep", class: "badge-pickup", diff: null };
    
    const scoreToCompare = isNet ? (strokes - strokesReceived) : strokes;
    const diff = scoreToCompare - par;
    
    if (diff <= -3) return { label: "Albatros", class: "badge-albatross", diff };
    if (diff === -2) return { label: "Eagle", class: "badge-eagle", diff };
    if (diff === -1) return { label: "Birdie", class: "badge-birdie", diff };
    if (diff === 0) return { label: "Par", class: "badge-par", diff };
    if (diff === 1) return { label: "Bogey", class: "badge-bogey", diff };
    if (diff === 2) return { label: "Double Bogey", class: "badge-double", diff };
    return { label: `+${diff}`, class: "badge-triple", diff };
  },

  /**
   * Bereken complete samenvatting voor een speler
   */
  calculateSummary(player, scores) {
    let grossTotal = 0;
    let netTotal = 0;
    let stablefordTotal = 0;
    let holesPlayed = 0;
    const holeBreakdown = [];

    COURSE_DATA.holes.forEach((hole) => {
      const hData = scores[hole.number] || {};
      const strokes = hData.strokes !== undefined && hData.strokes !== null && hData.strokes !== '' 
        ? parseInt(hData.strokes, 10) 
        : null;
      
      const teeKey = hData.tee || player.defaultTee || 'geel';
      const playingHcp = this.calculatePlayingHandicap(player.whsHandicap, teeKey);
      const strokesReceived = this.getStrokesReceived(hole.strokeIndex, playingHcp);
      
      let net = null;
      let stableford = 0;

      if (strokes !== null) {
        holesPlayed++;
        if (strokes > 0) {
          grossTotal += strokes;
          net = strokes - strokesReceived;
          netTotal += net;
          stableford = this.calculateStableford(strokes, hole.par, strokesReceived);
        } else {
          // Streep
          stableford = 0;
        }
        stablefordTotal += stableford;
      }

      holeBreakdown.push({
        holeNumber: hole.number,
        par: hole.par,
        strokeIndex: hole.strokeIndex,
        teeKey,
        distanceMeters: hole.distances[teeKey] || hole.distances.geel,
        strokes,
        strokesReceived,
        net,
        stableford,
        badge: this.getScoreBadge(strokes, hole.par, strokesReceived, false)
      });
    });

    return {
      grossTotal,
      netTotal,
      stablefordTotal,
      holesPlayed,
      stableford18Equiv: stablefordTotal + 18, // 9 holes + 18 fictief
      holeBreakdown
    };
  }
});
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandicapCalculator;
}
