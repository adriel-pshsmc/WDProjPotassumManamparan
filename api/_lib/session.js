const { withIronSessionApiRoute } = require('iron-session/next');

const sessionOptions = {
  cookieName: process.env.IRON_SESSION_COOKIE_NAME || 'su_session',
  password: process.env.IRON_SESSION_PASSWORD || process.env.SESSION_SECRET || 'dev-secret-must-change',
  // secure should be true in production (HTTPS)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production'
  }
};

function wrap(handler) {
  // withIronSessionApiRoute is designed for Next.js but works similarly for Vercel serverless handlers
  return withIronSessionApiRoute(handler, sessionOptions);
}

module.exports = { wrap };
