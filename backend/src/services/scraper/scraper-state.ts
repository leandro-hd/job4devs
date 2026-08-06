interface ScraperState {
  freelas99AuthExpired: boolean;
  freelas99AuthExpiredAlertSent: boolean;
}

const state: ScraperState = {
  freelas99AuthExpired: false,
  freelas99AuthExpiredAlertSent: false,
};

export function isFreelas99AuthExpired(): boolean {
  return state.freelas99AuthExpired;
}

export function setFreelas99AuthExpired(): void {
  state.freelas99AuthExpired = true;
}

export function isFreelas99AuthExpiredAlertSent(): boolean {
  return state.freelas99AuthExpiredAlertSent;
}

export function markFreelas99AuthExpiredAlertSent(): void {
  state.freelas99AuthExpiredAlertSent = true;
}
