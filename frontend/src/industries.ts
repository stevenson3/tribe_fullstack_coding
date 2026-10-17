// Mirrors backend/app/enums.py Naics2dIndustryCode
export const INDUSTRIES = [
  { value: "11", label: "Agriculture, Forestry, Fishing and Hunting" },
  { value: "21", label: "Mining, Quarrying, and Oil and Gas Extraction" },
  { value: "22", label: "Utilities" },
  { value: "23", label: "Construction" },
  { value: "31-33", label: "Manufacturing" },
  { value: "42", label: "Wholesale Trade" },
  { value: "44-45", label: "Retail Trade" },
  { value: "48-49", label: "Transportation and Warehousing" },
  { value: "51", label: "Information" },
  { value: "52", label: "Finance and Insurance" },
  { value: "53", label: "Real Estate and Rental and Leasing" },
  { value: "54", label: "Professional, Scientific, and Technical Services" },
  { value: "55", label: "Management of Companies and Enterprises" },
  { value: "56", label: "Administrative, Support, and Waste Management" },
  { value: "61", label: "Educational Services" },
  { value: "62", label: "Health Care and Social Assistance" },
  { value: "71", label: "Arts, Entertainment, and Recreation" },
  { value: "72", label: "Accommodation and Food Services" },
  { value: "81", label: "Other Services" },
  { value: "92", label: "Public Administration" },
] as const;

export type IndustryCode = (typeof INDUSTRIES)[number]["value"];

export function industryLabel(code: string): string {
  return INDUSTRIES.find((i) => i.value === code)?.label ?? code;
}
