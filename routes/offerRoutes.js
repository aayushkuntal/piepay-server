const express = require("express");
const { body } = require("express-validator");
const offerController = require("../controllers/offerController");

const router = express.Router();

const validateOfferRequest = [
  body("flipkartOfferApiResponse")
    .exists()
    .withMessage("flipkartOfferApiResponse is required")
    .isObject()
    .withMessage("flipkartOfferApiResponse must be an object"),
];

router.post("/", validateOfferRequest, offerController.processOffers);

module.exports = router;
