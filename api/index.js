module.exports = async (req, res) => {
  const { default: app } = await import('../artifacts/api-server/src/app.ts');
  return app(req, res);
};
