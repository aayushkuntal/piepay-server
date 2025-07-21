const Offer = require("../models/Offer");
const cache = require("../utils/cache");

class DiscountService {
    async calculateHighestDiscount(
        amountToPay,
        bankName,
        paymentInstrument = null,
    ) {
        const cacheKey = `discount_${amountToPay}_${bankName.toUpperCase()}_${paymentInstrument || "any"}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        const query = this.buildDiscountQuery(
            amountToPay,
            bankName.toUpperCase(),
            paymentInstrument?.toUpperCase(),
        );

        const applicableOffers = await Offer.find(query).lean();

        if (applicableOffers.length === 0) {
            const result = { highestDiscountAmount: 0 };
            cache.set(cacheKey, result, 300);
            return result;
        }

        let highestDiscount = 0;

        for (const offer of applicableOffers) {
            const discount = this.calculateDiscountForOffer(offer, amountToPay);
            if (discount > highestDiscount) {
                highestDiscount = discount;
            }
        }

        const result = { highestDiscountAmount: highestDiscount };
        cache.set(cacheKey, result, 300);

        return result;
    }

    buildDiscountQuery(amountToPay, bankName, paymentInstrument) {
        const query = {
            isActive: true,
            bankName,
            minimumAmount: { $lt: amountToPay },
            maxTxnValue: { $gte: amountToPay },
        };

        if (paymentInstrument) {
            query.paymentInstruments = paymentInstrument;
        }

        return query;
    }

    calculateDiscountForOffer(offer, amountToPay) {
        if (amountToPay < offer.minimumAmount) return 0;
        let calculatedDiscount = 0;

        if (offer.discountType === "PERCENTAGE") {
            calculatedDiscount = (amountToPay * offer.discountValue) / 100;
        } else if (offer.discountType === "FIXED_AMOUNT") {
            calculatedDiscount = offer.discountValue;
        } else if (offer.discountType === "CASHBACK") {
            if (offer.cashbackSubType === "PERCENTAGE") {
                calculatedDiscount = (amountToPay * offer.discountValue) / 100;
            } else if (offer.cashbackSubType === "FLAT") {
                calculatedDiscount = offer.discountValue;
            }
        }

        return Math.min(calculatedDiscount, offer.maximumDiscount);
    }
}

module.exports = new DiscountService();
