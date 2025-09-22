const sendResponse = (res, statuscode, success, message, data = null) => {
  return res.status(statuscode).json({
    success,
    message,
    data,
  });
};
module.exports = sendResponse;
