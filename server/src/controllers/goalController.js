export const getGoalsStub = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Goals API endpoint foundation ready. Database connection will be added in Phase 11.',
    data: [],
  });
};
