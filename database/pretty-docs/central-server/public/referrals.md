## referrals

`Referrals`).

Referrals use a confusing mix of data in the `referrals` table and
``survey_response_answers`` identified by
the text of the question they are for. 

Some additional data is captured in
`survey response answers`, but this is
variable and not enforced through any validation:
- Where the person is being referred to can be captured by a range of questions, sometimes with a
  list of hard coded facility name options, or location groups, or departments.
- Who the referral is "completed by" can be captured by a question either the name
  'Referring doctor' or 'Referral completed by'.
- Some referrals are the product of a previous screening survey. In some cases (e.g. Samoa) there is
  a SurveyLink question that captures which survey led to this referral, in others (e.g. Nauru)
  there is no such question so the two survey responses cannot be reliably linked.

## referred_facility

Unused.

## initiating_encounter_id

Reference to the `initiating encounter`.

## completing_encounter_id

Unused.

## survey_response_id

Reference to the `survey response` with more data.

## status

Status of the referral.

One of:
- `pending`
- `cancelled`
- `completed`

