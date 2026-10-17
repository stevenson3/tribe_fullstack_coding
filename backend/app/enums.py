from enum import StrEnum


class Naics2dIndustryCode(StrEnum):
    """2-digit NAICS industry sectors"""

    AGRICULTURE = "11"
    MINING = "21"
    UTILITIES = "22"
    CONSTRUCTION = "23"
    MANUFACTURING = "31-33"
    WHOLESALE_TRADE = "42"
    RETAIL_TRADE = "44-45"
    TRANSPORTATION_WAREHOUSING = "48-49"
    INFORMATION = "51"
    FINANCE_INSURANCE = "52"
    REAL_ESTATE = "53"
    PROFESSIONAL_SERVICES = "54"
    MANAGEMENT_OF_COMPANIES = "55"
    ADMIN_WASTE_SERVICES = "56"
    EDUCATIONAL_SERVICES = "61"
    HEALTH_CARE = "62"
    ARTS_ENTERTAINMENT = "71"
    ACCOMMODATION_FOOD_SERVICES = "72"
    OTHER_SERVICES = "81"
    PUBLIC_ADMINISTRATION = "92"


class TriageStatus(StrEnum):
    PENDING = "pending"  # record created, LLM call not finished
    SUCCESS = "success"
    ERROR = "error"
