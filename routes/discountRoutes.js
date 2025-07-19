
const express = require("express");
const { query } = require("express-validator");
const discountController = require("../controllers/discountController");

const router = express.Router();

const validateDiscountRequest = [
    query("amountToPay")
        .exists()
        .withMessage("amountToPay is required")
        .isNumeric()
        .withMessage("amountToPay must be a number")
        .isFloat({ min: 1 })
        .withMessage("amountToPay must be greater than 0"),

    query("bankName")
        .exists()
        .withMessage("bankName is required")
        .isString()
        .withMessage("bankName must be a string")
        .isLength({ min: 2 })
        .withMessage("bankName must be at least 2 characters"),

    query("paymentInstrument")
        .optional()
        .isString()
        .withMessage("paymentInstrument must be a string")
        .isIn(["CREDIT", "DEBIT", "EMI_OPTIONS", "UPI", "NET_BANKING"])
        .withMessage("Invalid paymentInstrument"),
];

router.get("/", validateDiscountRequest, discountController.getHighestDiscount);

module.exports = router;
