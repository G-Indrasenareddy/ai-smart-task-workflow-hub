export const getAuthStub = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth API endpoint foundation ready. JWT Authentication will be added in Phase 11.',
  });
};
