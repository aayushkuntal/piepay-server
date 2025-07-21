const Offer = require("../models/Offer");
const {
    BANK_NAMES,
    PAYMENT_INSTRUMENTS,
    DISCOUNT_TYPES,
    CASHBACK_SUB_TYPES,
} = require("../common/constants");
const cache = require("../utils/cache");

class OfferService {
    extractOffers(flipkartResponse) {
        const offers = [];

        if (flipkartResponse?.adjustments?.adjustment_list) {
            flipkartResponse.adjustments.adjustment_list.forEach(
                (adjustment) => {
                    if (adjustment.offer_details) {
                        const offerData = this.parseOfferData(adjustment);
                        if (offerData) {
                            offers.push(offerData);
                        }
                    }
                },
            );
        }

        return offers;
    }

    parseOfferData(adjustment) {
        const offerDetails = adjustment.offer_details;
        const summary = offerDetails.summary || "";
        const title = offerDetails.title || "";

        let bankName = "OTHER";
        for (const bank of BANK_NAMES) {
            if (
                title.toUpperCase().includes(bank) ||
                summary.toUpperCase().includes(bank)
            ) {
                bankName = bank;
                break;
            }
        }

        const supportedInstruments = this.extractPaymentInstruments(
            summary,
            title,
        );

        const { discountType, discountValue, cashbackSubType } =
            this.parseDiscountDetails(summary || title);

        if (!discountType || discountValue === 0) return null;

        const offerData = {
            adjustmentId: offerDetails.adjustment_id,
            bankName,
            discountType,
            discountValue,
            minimumAmount: offerDetails.offer_txn_limits?.min_txn_value || 0,
            maximumDiscount:
                offerDetails.offer_txn_limits?.max_discount_per_txn || 0,
            paymentInstruments: supportedInstruments,
            isActive: true,
            cashbackSubType:
                discountType === "CASHBACK" ? cashbackSubType : undefined,
            maxTxnValue:
                offerDetails.offer_txn_limits?.max_txn_value ||
                Number.MAX_SAFE_INTEGER,
            maxDiscountPerCard:
                offerDetails.offer_aggregation_limits?.max_discount_per_card ||
                0,
            maxTxnsForOffer:
                offerDetails.offer_aggregation_limits?.max_txns_for_offer || 0,
        };

        return offerData;
    }

    extractPaymentInstruments(summary, title) {
        const text = (summary + " " + title).toUpperCase();
        const instruments = [];

        if (text.includes("CREDIT CARD")) instruments.push("CREDIT");
        if (text.includes("DEBIT CARD")) instruments.push("DEBIT");
        if (text.includes("EMI")) instruments.push("EMI_OPTIONS");
        if (text.includes("UPI")) instruments.push("UPI");
        if (text.includes("NET BANKING") || text.includes("NETBANKING"))
            instruments.push("NET_BANKING");

        return instruments.length > 0 ? instruments : [];
    }

    parseDiscountDetails(text) {
        const upperText = text.toUpperCase();
        let discountType = "CASHBACK";
        let discountValue = 0;
        let cashbackSubType = "FLAT";

        const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
        if (percentMatch) {
            discountValue = parseFloat(percentMatch[1]);
            cashbackSubType = "PERCENTAGE";
            discountType = upperText.includes("CASHBACK")
                ? "CASHBACK"
                : "PERCENTAGE";
            return { discountType, discountValue, cashbackSubType };
        }

        const flatMatch =
            text.match(/FLAT\s*₹?\s*(\d+)/i) ||
            text.match(/UP TO\s*₹?\s*(\d+)/i) ||
            text.match(/₹?\s*(\d+)\s*CASHBACK/i);
        if (flatMatch) {
            discountValue = parseInt(flatMatch[1]);
            cashbackSubType = "FLAT";
            discountType = upperText.includes("CASHBACK")
                ? "CASHBACK"
                : "FIXED_AMOUNT";
            return { discountType, discountValue, cashbackSubType };
        }

        return { discountType, discountValue, cashbackSubType };
    }

    async storeOffers(offers) {
        if (!offers || offers.length === 0) {
            return { identified: 0, created: 0, modified: 0, errors: [] };
        }

        const operations = offers.map((offerData) => ({
            updateOne: {
                filter: { adjustmentId: offerData.adjustmentId },
                update: { $set: offerData },
                upsert: true,
            },
        }));

        try {
            const result = await Offer.bulkWrite(operations, {
                ordered: false,
            });

            const cacheKeys = offers.map(
                (offer) => `offer:${offer.adjustmentId}`,
            );
            cache.del(cacheKeys);

            return {
                identified: offers.length,
                created: result?.upsertedCount || 0,
                modified: result?.modifiedCount || 0,
                errors: [],
            };
        } catch (error) {
            console.error("Error during bulk write of offers:", error.message);
            return {
                identified: offers.length,
                created: 0,
                modified: 0,
                errors: [{ message: error.message, stack: error.stack }],
            };
        }
    }
}

module.exports = new OfferService();
