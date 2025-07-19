// models/Offer.js
const mongoose = require("mongoose");
const {
    BANK_NAMES,
    DISCOUNT_TYPES,
    CASHBACK_SUB_TYPES,
    PAYMENT_INSTRUMENTS,
} = require("../common/constants");

const offerSchema = new mongoose.Schema(
    {
        adjustmentId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        bankName: {
            type: String,
            required: true,
            uppercase: true,
            enum: BANK_NAMES,
        },
        discountType: {
            type: String,
            required: true,
            enum: DISCOUNT_TYPES,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        minimumAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        maximumDiscount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentInstruments: [
            {
                type: String,
                enum: PAYMENT_INSTRUMENTS,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        cashbackSubType: {
            type: String,
            enum: CASHBACK_SUB_TYPES,
        },
        maxTxnValue: {
            type: Number,
            default: Number.MAX_SAFE_INTEGER,
        },
        maxDiscountPerCard: {
            type: Number,
            default: 0,
        },
        maxTxnsForOffer: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

// Compound indexes for efficient querying
offerSchema.index({ bankName: 1, paymentInstruments: 1, isActive: 1 });
offerSchema.index({ minimumAmount: 1, maxTxnValue: 1, maximumDiscount: -1 });

module.exports = mongoose.model("Offer", offerSchema);
