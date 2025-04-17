export default {
  async fetch(request: Request, env: any) {
    // This will serve your static assets from ./dist
    return env.ASSETS.fetch(request);
  }
};