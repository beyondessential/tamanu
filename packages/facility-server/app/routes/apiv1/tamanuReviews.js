import express from 'express';
import asyncHandler from 'express-async-handler';
import { ValidationError } from '@tamanu/errors';

export const tamanuReviews = express.Router();

tamanuReviews.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');

    const reviews = await req.models.TamanuReview.findAll({
      include: req.models.TamanuReview.getListReferenceAssociations(),
      order: [['createdAt', 'DESC']],
    });

    res.send({
      count: reviews.length,
      data: reviews.map(review => review.forResponse()),
    });
  }),
);

tamanuReviews.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');

    const { isPositive, comment } = req.body;
    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    if (typeof isPositive !== 'boolean') {
      throw new ValidationError('isPositive must be a boolean');
    }
    if (!trimmedComment) {
      throw new ValidationError('comment is required');
    }

    const review = await req.models.TamanuReview.create({
      isPositive,
      comment: trimmedComment,
      submittedById: req.user.id,
    });

    const reviewWithRelations = await req.models.TamanuReview.findByPk(review.id, {
      include: req.models.TamanuReview.getListReferenceAssociations(),
    });

    res.send(reviewWithRelations.forResponse());
  }),
);
