import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Typography, TextField } from '@material-ui/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Colors } from '../../constants';
import { useApi } from '../../api';
import { Button, ContentPane, PageContainer, TopBar } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const FormCard = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 6px;
  background: ${Colors.white};
`;

const SentimentButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const SentimentButton = styled.button`
  width: 46px;
  height: 46px;
  border-radius: 8px;
  border: 2px solid ${props => (props.$selected ? Colors.primary : Colors.softOutline)};
  background: ${props => (props.$selected ? Colors.primary : Colors.white)};
  color: ${props => (props.$selected ? Colors.white : Colors.midText)};
  cursor: pointer;
  font-size: 20px;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${Colors.primary};
    color: ${props => (props.$selected ? Colors.white : Colors.primary)};
  }
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReviewItem = styled.div`
  padding: 14px 16px;
  border-radius: 6px;
  background: ${Colors.white};
  border-left: 4px solid ${props => (props.$isPositive ? Colors.green : Colors.alert)};
`;

const ReviewMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${Colors.midText};
  margin-bottom: 8px;
`;

const ReviewComment = styled(Typography)`
  color: ${Colors.darkText};
`;

export const TamanuReviewsView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [isPositive, setIsPositive] = useState(true);
  const [comment, setComment] = useState('');
  const [hasCommentError, setHasCommentError] = useState(false);

  const { data: reviewsResponse } = useQuery(['tamanuReviews'], () => api.get('tamanuReviews'));
  const reviews = useMemo(() => reviewsResponse?.data ?? [], [reviewsResponse?.data]);

  const createReviewMutation = useMutation(
    reviewBody => api.post('tamanuReviews', reviewBody),
    {
      onSuccess: () => {
        setComment('');
        setHasCommentError(false);
        queryClient.invalidateQueries(['tamanuReviews']);
      },
    },
  );

  const onSubmit = async event => {
    event.preventDefault();

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setHasCommentError(true);
      return;
    }
    setHasCommentError(false);

    await createReviewMutation.mutateAsync({
      isPositive,
      comment: trimmedComment,
    });
  };

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText
            stringId="tamanuReviews.title"
            fallback="Tamanu Reviews"
            data-testid="translatedtext-tamanu-reviews-title"
          />
        }
      />
      <ContentPane>
        <FormCard onSubmit={onSubmit}>
          <Typography variant="h6">
            <TranslatedText
              stringId="tamanuReviews.form.title"
              fallback="Add a review"
              data-testid="translatedtext-tamanu-reviews-form-title"
            />
          </Typography>
          <SentimentButtons>
            <SentimentButton
              type="button"
              onClick={() => setIsPositive(true)}
              $selected={isPositive}
              aria-label="Positive review"
              data-testid="button-tamanu-reviews-positive"
            >
              <i className="fas fa-thumbs-up" />
            </SentimentButton>
            <SentimentButton
              type="button"
              onClick={() => setIsPositive(false)}
              $selected={!isPositive}
              aria-label="Negative review"
              data-testid="button-tamanu-reviews-negative"
            >
              <i className="fas fa-thumbs-down" />
            </SentimentButton>
          </SentimentButtons>
          <TextField
            multiline
            rows={3}
            value={comment}
            onChange={event => setComment(event.target.value)}
            label={
              <TranslatedText
                stringId="tamanuReviews.form.commentLabel"
                fallback="Comment"
                data-testid="translatedtext-tamanu-reviews-comment-label"
              />
            }
            error={hasCommentError}
            helperText={
              hasCommentError ? (
                <TranslatedText
                  stringId="tamanuReviews.form.commentRequired"
                  fallback="Please enter a comment"
                  data-testid="translatedtext-tamanu-reviews-comment-required"
                />
              ) : null
            }
            fullWidth
          />
          <Button type="submit" disabled={createReviewMutation.isLoading}>
            <TranslatedText
              stringId="tamanuReviews.form.submit"
              fallback="Post review"
              data-testid="translatedtext-tamanu-reviews-submit"
            />
          </Button>
        </FormCard>
      </ContentPane>
      <ContentPane>
        <Typography variant="h6" style={{ marginBottom: 12 }}>
          <TranslatedText
            stringId="tamanuReviews.list.title"
            fallback="Recent reviews"
            data-testid="translatedtext-tamanu-reviews-list-title"
          />
        </Typography>
        <ReviewList>
          {reviews.map(review => (
            <ReviewItem key={review.id} $isPositive={review.isPositive}>
              <ReviewMeta>
                <i className={review.isPositive ? 'fas fa-thumbs-up' : 'fas fa-thumbs-down'} />
                <Typography variant="body2">{review.submittedBy?.displayName}</Typography>
                <Typography variant="body2">{new Date(review.createdAt).toLocaleString()}</Typography>
              </ReviewMeta>
              <ReviewComment variant="body1">{review.comment}</ReviewComment>
            </ReviewItem>
          ))}
          {!reviews.length ? (
            <Typography variant="body2" style={{ color: Colors.softText }}>
              <TranslatedText
                stringId="tamanuReviews.list.empty"
                fallback="No reviews yet"
                data-testid="translatedtext-tamanu-reviews-empty"
              />
            </Typography>
          ) : null}
        </ReviewList>
      </ContentPane>
    </PageContainer>
  );
};
