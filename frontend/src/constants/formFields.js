// Common form field configurations
export const ADDRESS_FIELDS = [
  {
    name: `addressStreet`,
    label: `Street, House Number`,
    type: `text`,
  },
  {
    name: `addressZip`,
    label: `Zip`,
    type: `text`,
  },
  {
    name: `addressCity`,
    label: `City`,
    type: `text`,
  },
  {
    name: `addressCountry`,
    label: `Country`,
    type: `text`,
    defaultValue: `Deutschland`,
  },
];

export const CONTACT_FIELDS = [
  {
    name: `email`,
    label: `Email`,
    type: `email`,
    required: true,
  },
  {
    name: `phone`,
    label: `Phone`,
    type: `tel`,
    required: true,
  },
];

export const PERSON_FIELDS = [
  {
    name: `firstName`,
    label: `First Name`,
    type: `text`,
    required: true,
  },
  {
    name: `lastName`,
    label: `Last Name`,
    type: `text`,
    required: true,
  },
];

export const SALUTATION_OPTIONS = [
  {
    value: 1,
    label: `Frau`, 
  },
  {
    value: 0,
    label: `Herr`, 
  },
];

export const TIME_DURATIONS = [
  {
    value: `00:15:00`,
    label: `15 min`, 
  },
  {
    value: `00:30:00`,
    label: `30 min`, 
  },
  {
    value: `00:45:00`,
    label: `45 min`, 
  },
  {
    value: `01:00:00`,
    label: `1 hour`, 
  },
  {
    value: `01:15:00`,
    label: `1 hour 15 min`, 
  },
  {
    value: `01:30:00`,
    label: `1 hour 30 min`, 
  },
  {
    value: `01:45:00`,
    label: `1 hour 45 min`, 
  },
  {
    value: `02:00:00`,
    label: `2 hours`, 
  },
  {
    value: `02:30:00`,
    label: `2 hours 30 min`, 
  },
  {
    value: `03:00:00`,
    label: `3 hours`, 
  },
  {
    value: `03:30:00`,
    label: `3 hours 30 min`, 
  },
  {
    value: `04:00:00`,
    label: `4 hours`, 
  },
];

export const BUFFER_TIME_OPTIONS = [
  {
    value: ``,
    label: `Clear`, 
  },
  ...TIME_DURATIONS,
];

export const DAYS_TO_PAY = [
  {
    value: 0,
    label: `Today`, 
  },
  {
    value: 1,
    label: `1`, 
  },
  {
    value: 7,
    label: `7`, 
  },
  {
    value: 14,
    label: `14`, 
  },
  {
    value: 30,
    label: `30`, 
  },
  {
    value: 60,
    label: `60`, 
  },
  {
    value: 90,
    label: `90`, 
  },
];

export const TAX_RATES = [
  {
    value: `0`,
    label: `0%`, 
  },
  {
    value: `7`,
    label: `7%`, 
  },
  {
    value: `19`,
    label: `19%`, 
  },
];

export const EMPLOYEE_FIELDS = [
  ...PERSON_FIELDS,
  ...CONTACT_FIELDS,
];

export const CUSTOMER_FIELDS = [
  {
    name: `salutation`,
    label: `Anrede`,
    type: `radio`,
    options: SALUTATION_OPTIONS,
    required: true,
  },
  ...PERSON_FIELDS,
  ...CONTACT_FIELDS,
  ...ADDRESS_FIELDS,
];