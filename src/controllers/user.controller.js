exports.signup = (req, res) => {
  res.json({
    message: "User signup successful",
    data: req.body,
  });
};
