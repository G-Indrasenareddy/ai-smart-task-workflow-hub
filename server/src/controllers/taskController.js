export const getTasksStub = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tasks API endpoint foundation ready. Database connection will be added in Phase 11.',
    data: [],
  });
};
