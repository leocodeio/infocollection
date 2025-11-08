// Cookie names for authentication tokens
export const cookieConstants = {
  accessTokenName: 'leostack.access_token',
  refreshTokenName: 'leostack.refresh_token',
  sessionName: 'leostack.session_token',
};

// Authentication constants
export const authConstants = {
  bcryptSaltRounds: 10,
  accessTokenExpiry: '7d', // 7 days
  refreshTokenExpiry: '30d', // 30 days
};
