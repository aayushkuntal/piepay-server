// controllers/offerController.js
const offerService = require('../services/offerService');
const { validationResult } = require('express-validator');

class OfferController {
    async processOffers(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Invalid request',
                    details: errors.array()
                });
            }

            const { flipkartOfferApiResponse } = req.body;

            if (!flipkartOfferApiResponse) {
                return res.status(400).json({
                    error: 'flipkartOfferApiResponse is required'
                });
            }

            const offers = offerService.extractOffers(flipkartOfferApiResponse);
            const result = await offerService.storeOffers(offers);

            res.json({
                noOfOffersIdentified: result.identified,
                noOfNewOffersCreated: result.created
            });

        } catch (error) {
            console.error('Error processing offers:', error);
            next(error);
        }
    }
}

module.exports = new OfferController();
