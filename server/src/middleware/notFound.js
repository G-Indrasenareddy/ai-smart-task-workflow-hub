export const notFound = (req, res, next) => {
  const error = new Error(`API endpoint not found - ${req.originalUrl}`);
  res.status(404);
  res.json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
};
