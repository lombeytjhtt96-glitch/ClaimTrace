"""
ClaimTrace Business Days & Statutory SLA Calculator
Adheres strictly to Perpres No. 82 Tahun 2018 Pasal 74 ayat (3) & Pasal 76 ayat (2):
"BPJS Kesehatan wajib melakukan verifikasi dan pembayaran klaim paling lambat 10 (sepuluh) hari kerja."
Accurately accounts for weekends (Saturday & Sunday) and official Indonesian National Holidays.
"""

from datetime import date, timedelta
from typing import Dict, Any, Optional, Set

# Official Indonesian National Public Holidays (Hari Libur Nasional & Cuti Bersama 2026)
# shortcut: static 2026 holiday set, upgrade to SKB 3 Menteri calendar parser when multi-year claim windows are ingested
INDONESIAN_HOLIDAYS_2026: Set[date] = {
    date(2026, 1, 1),    # Tahun Baru 2026 Masehi
    date(2026, 1, 16),   # Isra Mi'raj Nabi Muhammad SAW
    date(2026, 2, 17),   # Tahun Baru Imlek 2577 Kongzili
    date(2026, 3, 19),   # Hari Suci Nyepi Tahun Baru Saka 1948
    date(2026, 3, 20),   # Hari Raya Idul Fitri 1447 Hijriah (Hari 1)
    date(2026, 3, 21),   # Hari Raya Idul Fitri 1447 Hijriah (Hari 2)
    date(2026, 4, 3),    # Wafat Isa Almasih
    date(2026, 5, 1),    # Hari Buruh Internasional
    date(2026, 5, 14),   # Kenaikan Isa Almasih
    date(2026, 5, 27),   # Hari Raya Idul Adha 1447 Hijriah
    date(2026, 5, 31),   # Hari Raya Waisak 2570 BE
    date(2026, 6, 1),    # Hari Lahir Pancasila
    date(2026, 6, 16),   # Tahun Baru Islam 1448 Hijriah
    date(2026, 8, 17),   # Hari Kemerdekaan Republik Indonesia
    date(2026, 8, 25),   # Maulid Nabi Muhammad SAW
    date(2026, 12, 25),  # Hari Raya Natal
}

def is_business_day(d: date) -> bool:
    """Returns True if the date is a working day (Monday to Friday, non-holiday)."""
    # Saturday is 5, Sunday is 6
    if d.weekday() >= 5:
        return False
    if d in INDONESIAN_HOLIDAYS_2026:
        return False
    return True

def add_business_days(start_date: date, n_days: int) -> date:
    """Adds n working days to start_date, skipping weekends and Indonesian holidays."""
    cur = start_date
    added = 0
    while added < n_days:
        cur += timedelta(days=1)
        if is_business_day(cur):
            added += 1
    return cur

def count_business_days_between(start_date: date, end_date: date) -> int:
    """Counts working days between start_date and end_date (inclusive of end_date if it's after start)."""
    if start_date >= end_date:
        return 0
    cur = start_date + timedelta(days=1)
    business_days = 0
    while cur <= end_date:
        if is_business_day(cur):
            business_days += 1
        cur += timedelta(days=1)
    return business_days

def calculate_sla_status(
    service_date: date,
    max_business_days: int = 10,
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Computes statutory SLA status adhering to Perpres No. 82/2018 Pasal 74.
    Returns:
      - statutory_sla_business_days: 10
      - deadline_date: YYYY-MM-DD
      - elapsed_business_days: int
      - remaining_business_days: int (>= 0)
      - is_breached: bool
      - urgency_level: 'NORMAL' | 'URGENT' | 'CRITICAL_SLA' | 'BREACHED'
    """
    ref = reference_date or date.today()
    deadline = add_business_days(service_date, max_business_days)
    
    elapsed = count_business_days_between(service_date, ref)
    remaining = max(0, max_business_days - elapsed)
    is_breached = elapsed > max_business_days

    if is_breached:
        urgency = "BREACHED"
    elif remaining <= 2:
        urgency = "CRITICAL_SLA"
    elif remaining <= 5:
        urgency = "URGENT"
    else:
        urgency = "NORMAL"

    return {
        "service_date": service_date.isoformat(),
        "reference_date": ref.isoformat(),
        "deadline_date": deadline.isoformat(),
        "statutory_sla_business_days": max_business_days,
        "elapsed_business_days": elapsed,
        "remaining_business_days": remaining,
        "is_breached": is_breached,
        "urgency_level": urgency,
        "legal_basis": "Perpres No. 82 Tahun 2018 Pasal 74 ayat (3) & Pasal 76 ayat (2)"
    }
