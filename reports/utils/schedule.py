"""Canonical FedRAMP 20x reporting schedule per RFC-0016.

Single source of truth for OAR and Quarterly Review dates. Every report
generator (reports/generate_public_reports.py, reports/oar_generator.py,
reports/qar_generator.py) imports from here so the trust center, the OAR,
and the QAR can never drift apart.

Cycle anchors: Feb 15, May 15, Aug 15, Nov 15 (UTC). These satisfy
FRR-CCM-02 ("regular 3-month cycle that does not align with calendar
quarters") because calendar quarters start Jan/Apr/Jul/Oct.

Meeting date rule: FRR-CCM-QR-02 requires the Quarterly Review to occur
"at least 3 business days after releasing an Ongoing Authorization Report
AND within 2 weeks". We pick a deterministic date 10 calendar days after
the OAR cycle anchor, which always falls in the [3 business days, 14
calendar days] window.
"""

from datetime import datetime, timedelta, timezone

CYCLE_ANCHORS = [(2, 15), (5, 15), (8, 15), (11, 15)]
MEETING_OFFSET_DAYS = 10  # OAR + 10 calendar days always satisfies FRR-CCM-QR-02


def _as_utc(now):
    if now is None:
        return datetime.now(timezone.utc)
    if now.tzinfo is None:
        return now.replace(tzinfo=timezone.utc)
    return now.astimezone(timezone.utc)


def next_oar_cycle_date(now=None):
    """Next OAR release date strictly after `now`."""
    now = _as_utc(now)
    for month, day in CYCLE_ANCHORS:
        candidate = datetime(now.year, month, day, tzinfo=timezone.utc)
        if candidate > now:
            return candidate
    return datetime(now.year + 1, CYCLE_ANCHORS[0][0], CYCLE_ANCHORS[0][1], tzinfo=timezone.utc)


def last_oar_cycle_date(now=None):
    """Most recent OAR release date on or before `now`."""
    now = _as_utc(now)
    for month, day in reversed(CYCLE_ANCHORS):
        candidate = datetime(now.year, month, day, tzinfo=timezone.utc)
        if candidate <= now:
            return candidate
    return datetime(now.year - 1, CYCLE_ANCHORS[-1][0], CYCLE_ANCHORS[-1][1], tzinfo=timezone.utc)


def next_quarterly_review_date(oar_date):
    """QR meeting date satisfying FRR-CCM-QR-02 (>=3 business days after OAR, <=14 calendar days)."""
    return oar_date + timedelta(days=MEETING_OFFSET_DAYS)


def quarterly_dates(now=None):
    """All dates the report generators need, derived once from `now`."""
    now = _as_utc(now)
    next_oar = next_oar_cycle_date(now)
    last_oar = last_oar_cycle_date(now)
    next_review = next_quarterly_review_date(next_oar)
    return {
        "now": now,
        "next_oar_date": next_oar,
        "next_oar_iso": next_oar.strftime("%Y-%m-%d"),
        "next_review_date": next_review,
        "next_review_iso": next_review.strftime("%Y-%m-%d"),
        "next_review_display": next_review.strftime("%B %d, %Y"),
        "last_oar_date": last_oar,
        "last_oar_iso": last_oar.strftime("%Y-%m-%d"),
    }


def business_days_between(start, end):
    """Inclusive-exclusive count of weekdays in [start, end)."""
    if end <= start:
        return 0
    days = (end.date() - start.date()).days
    full_weeks, remainder = divmod(days, 7)
    business = full_weeks * 5
    start_weekday = start.weekday()
    for i in range(remainder):
        if (start_weekday + i) % 7 < 5:
            business += 1
    return business


def validate_qr_window(oar_date, review_date):
    """FRR-CCM-QR-02 enforcement: review must be 3+ business days after OAR and within 2 weeks."""
    business = business_days_between(oar_date, review_date)
    calendar = (review_date - oar_date).days
    if business < 3:
        raise ValueError(
            f"FRR-CCM-QR-02 violation: review {review_date} is {business} business days "
            f"after OAR {oar_date}; requires >=3"
        )
    if calendar > 14:
        raise ValueError(
            f"FRR-CCM-QR-02 violation: review {review_date} is {calendar} calendar days "
            f"after OAR {oar_date}; requires <=14"
        )
    return True
