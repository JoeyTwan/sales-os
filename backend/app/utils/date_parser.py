import re
from datetime import datetime, timedelta
from typing import Optional


def parse_natural_date(date_str: str) -> Optional[str]:
    if not date_str:
        return None
    
    date_str = date_str.strip()
    
    today = datetime.now().date()
    
    if date_str == "今天":
        return today.isoformat()
    elif date_str == "明天":
        return (today + timedelta(days=1)).isoformat()
    elif date_str == "后天":
        return (today + timedelta(days=2)).isoformat()
    elif date_str == "大后天":
        return (today + timedelta(days=3)).isoformat()
    
    weekday_map = {
        "周一": 0,
        "周二": 1,
        "周三": 2,
        "周四": 3,
        "周五": 4,
        "周六": 5,
        "周日": 6,
    }
    
    match = re.search(r"下(周一|周二|周三|周四|周五|周六|周日)", date_str)
    if match:
        target_weekday = weekday_map[match.group(1)]
        days_ahead = target_weekday - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return (today + timedelta(days=days_ahead)).isoformat()
    
    match = re.search(r"(周一|周二|周三|周四|周五|周六|周日)", date_str)
    if match:
        target_weekday = weekday_map[match.group(1)]
        days_ahead = target_weekday - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        return (today + timedelta(days=days_ahead)).isoformat()
    
    if date_str == "周末":
        days_ahead = 5 - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        return (today + timedelta(days=days_ahead)).isoformat()
    
    if date_str == "月底":
        next_month = today.replace(day=28) + timedelta(days=4)
        last_day = next_month - timedelta(days=next_month.day)
        return last_day.isoformat()
    
    if date_str == "下个月初":
        next_month = today.replace(day=28) + timedelta(days=4)
        first_day = next_month.replace(day=1)
        return first_day.isoformat()
    
    date_patterns = [
        r"(\d+)月(\d+)日?",
        r"(\d+)/(\d+)",
        r"(\d{4})-(\d{1,2})-(\d{1,2})",
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, date_str)
        if match:
            try:
                if len(match.groups()) == 2:
                    month = int(match.group(1))
                    day = int(match.group(2))
                    year = today.year
                    if month < today.month:
                        year += 1
                    date = datetime(year, month, day).date()
                    return date.isoformat()
                elif len(match.groups()) == 3:
                    year = int(match.group(1))
                    month = int(match.group(2))
                    day = int(match.group(3))
                    date = datetime(year, month, day).date()
                    return date.isoformat()
            except ValueError:
                continue
    
    return None