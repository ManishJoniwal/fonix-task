const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const sendResponse = require("../utils/sendResponse");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    let { page = 1, limit = 5, username, email, mobile } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const filter = {};
    if (username) filter.username = username;
    if (email) filter.email = email;
    if (mobile) filter.mobile = mobile;
    const totalItems = await userModel.countDocuments(filter);

    const users = await userModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    if (!users || users.length == 0) {
      return sendResponse(res, 404, false, "no users found");
    }
    sendResponse(res, 200, true, "user fetch succesfully", {
      totalItems,
      totalpages: Math.ceil(totalItems / limit),
      page,
      limit,
      users: users,
    });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, false, "interval server error");
  }
});
module.exports = router;
