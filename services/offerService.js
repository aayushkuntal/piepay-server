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
            if (title.toUpperCase().includes(bank) || summary.toUpperCase().includes(bank)) {
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
        else if (text.includes("DEBIT CARD")) instruments.push("DEBIT");
        else if (text.includes("EMI")) instruments.push("EMI_OPTIONS");
        else if (text.includes("UPI")) instruments.push("UPI");
        else if (text.includes("NET BANKING") || text.includes("NETBANKING"))
            instruments.push("NET_BANKING");

        return instruments.length > 0 ? instruments : [];
    }

    parseDiscountDetails(text) {
        const upperText = text.toUpperCase();
        let discountType = "CASHBACK";
        let discountValue = 0;
        let cashbackSubType = "FLAT";

        const percentMatch = text.match(/(\d+)%/);
        if (percentMatch) {
            discountValue = parseInt(percentMatch[1]);
            cashbackSubType = "PERCENTAGE";
            if (upperText.includes("CASHBACK")) {
                discountType = "CASHBACK";
            } else {
                discountType = "PERCENTAGE";
            }
            return { discountType, discountValue, cashbackSubType };
        }

        const flatMatch =
            text.match(/FLAT ₹?(\d+)/i) ||
            text.match(/UP TO ₹?(\d+)/i) ||
            text.match(/₹?(\d+) CASHBACK/i);
        if (flatMatch) {
            discountValue = parseInt(flatMatch[1]);
            cashbackSubType = "FLAT";
            if (upperText.includes("CASHBACK")) {
                discountType = "CASHBACK";
            } else {
                discountType = "FIXED_AMOUNT";
            }
            return { discountType, discountValue, cashbackSubType };
        }

        return { discountType, discountValue, cashbackSubType };
    }
    
    async storeOffers(offers) {
        if (!offers || offers.length === 0) {
            return { identified: 0, created: 0, modified: 0, errors: [] };
        }

        const session = await Offer.startSession();
        let result = null;

        const operations = offers.map(offerData => ({
            updateOne: {
                filter: { adjustmentId: offerData.adjustmentId },
                update: { $set: offerData },
                upsert: true,
            },
        }));

        try {
            await session.withTransaction(async () => {
                result = await Offer.bulkWrite(operations, { session, ordered: false });

                const cacheKeys = offers.map(offer => `offer:${offer.adjustmentId}`);
                await cache.del(cacheKeys);
            });

            return {
                identified: offers.length,
                created: result?.upsertedCount || 0,
                modified: result?.modifiedCount || 0,
                errors: [],
            };
        } catch (error) {
            console.error("Error during bulk write transaction of offers:", error.message);
            return {
                identified: offers.length,
                created: 0,
                modified: 0,
                errors: [{ message: error.message, stack: error.stack }],
            };
        } finally {
            session.endSession();
        }
    }
}

module.exports = new OfferService();
