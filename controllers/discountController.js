const discountService = require("../services/discountService");
const { validationResult } = require("express-validator");

class DiscountController {
    async getHighestDiscount(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: "Invalid request",
                    details: errors.array(),
                });
            }

            const { amountToPay, bankName, paymentInstrument } = req.query;

            const result = await discountService.calculateHighestDiscount(
                parseInt(amountToPay),
                bankName,
                paymentInstrument,
            );

            res.json(result);
        } catch (error) {
            console.error("Error calculating discount:", error);
            next(error);
        }
    }
}

module.exports = new DiscountController();
