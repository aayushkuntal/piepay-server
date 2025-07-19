// routes/offerRoutes.js
const express = require("express");
const { body } = require("express-validator");
const offerController = require("../controllers/offerController");

const router = express.Router();

// Validation middleware for POST /offer
const validateOfferRequest = [
  body("flipkartOfferApiResponse")
    .exists()
    .withMessage("flipkartOfferApiResponse is required")
    .isObject()
    .withMessage("flipkartOfferApiResponse must be an object"),
];

// POST /offer - Process Flipkart offer response
router.post("/", validateOfferRequest, offerController.processOffers);

module.exports = router;
