/**
 * Lokale opslag voor Instellingen, Actieve Ronde en Historie
 */

const STORAGE_KEYS = {
  PREFERENCES: 'zeegersloot_golf_prefs',
  ACTIVE_ROUND: 'zeegersloot_active_round',
  ROUNDS_HISTORY: 'zeegersloot_rounds_history'
};

const StorageManager = (typeof window !== 'undefined' ? window.StorageManager = {} : {});
Object.assign(StorageManager, {
  /**
   * Standaardvoorkeuren ophalen
   */
  getPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading preferences', e);
    }

    return {
      user: {
        name: "Mijn Score",
        whsHandicap: 24.0,
        defaultTee: "geel"
      },
      partner: {
        name: "Speelpartner",
        whsHandicap: 28.0,
        defaultTee: "geel"
      },
      coverScreenMode: false,
      golfdashboardUrl: "https://zeegersloot.golfdashboard.com"
    };
  },

  /**
   * Voorkeuren opslaan
   */
  savePreferences(prefs) {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (e) {
      console.error('Error saving preferences', e);
    }
  },

  /**
   * Actieve ronde ophalen
   */
  getActiveRound() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROUND);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading active round', e);
      return null;
    }
  },

  /**
   * Actieve ronde opslaan
   */
  saveActiveRound(round) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROUND, JSON.stringify(round));
    } catch (e) {
      console.error('Error saving active round', e);
    }
  },

  /**
   * Actieve ronde wissen (bij voltooien of annuleren)
   */
  clearActiveRound() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROUND);
    } catch (e) {
      console.error('Error clearing active round', e);
    }
  },

  /**
   * Historie van alle rondes ophalen
   */
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUNDS_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading history', e);
      return [];
    }
  },

  /**
   * Ronde toevoegen aan de historie
   */
  saveCompletedRound(round) {
    try {
      const history = this.getHistory();
      // Nieuwste bovenaan
      history.unshift({
        id: round.id || 'rnd_' + Date.now(),
        date: round.date || new Date().toISOString(),
        formattedDate: new Date().toLocaleDateString('nl-NL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        partner: round.partner,
        user: round.user,
        scores: round.scores,
        partnerSummary: round.partnerSummary,
        userSummary: round.userSummary
      });
      localStorage.setItem(STORAGE_KEYS.ROUNDS_HISTORY, JSON.stringify(history));
      this.clearActiveRound();
    } catch (e) {
      console.error('Error saving completed round to history', e);
    }
  },

  /**
   * Ronde verwijderen uit historie
   */
  deleteRoundFromHistory(roundId) {
    try {
      let history = this.getHistory();
      history = history.filter(r => r.id !== roundId);
      localStorage.setItem(STORAGE_KEYS.ROUNDS_HISTORY, JSON.stringify(history));
      return history;
    } catch (e) {
      console.error('Error deleting round', e);
      return [];
    }
  }
});
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
