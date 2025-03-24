# Email Templates for Dorosh Studio

## Overview

This documentation describes the email templates used in the Dorosh Studio system. The templates are created using Handlebars and located in the `src/templates/emails` directory.

## Template Structure

All email templates share a common design and style that matches the Dorosh Studio brand:

- Color scheme: dark gray (#333333), soft red (#D6796C)
- Fonts: Cinzel (for headings), Poppins (for body text)
- Responsive design for mobile devices

## Available Templates

### 1. Appointment Confirmation (appointment-confirmation.html)

**Purpose**: Sent to the client to confirm a booking.

**Context Variables**:
- `date`: Appointment date in DD.MM.YYYY format
- `time`: Appointment time in HH:MM format
- `service`: Service name
- `specialist`: Specialist name (optional)
- `location`: Salon address (optional)
- `lastName`: Client's last name
- `salutation`: Salutation ('male' for men, 'female' for women)

**Usage Example**:
```typescript
sendAppointmentConfirmationEmail(
  'client@example.com',
  {
    date: '01.04.2023',
    time: '14:00',
    service: 'Haarschnitt',
    specialist: 'Anna Müller',
    location: 'Musterstraße, Berlin',
    lastName: 'Schmidt',
    salutation: 'male',
  }
);
```

### 2. Password Reset (password-reset.html)

**Purpose**: Sent to the user to reset a forgotten password.

**Context Variables**:
- `resetUrl`: URL for password reset

**Usage Example**:
```typescript
sendPasswordResetEmail(
  'user@example.com',
  'reset-token-example'
);
```

## Guidelines for Developing New Templates

When creating new email templates, follow these rules:

1. **Maintain consistent style**: Use existing colors, fonts, and components.
2. **Ensure responsiveness**: Test the template on mobile devices.
3. **Optimize images**: If using images, make sure they are optimized.
4. **Test in different clients**: Test in Gmail, Outlook, and other popular email clients.

## Handlebars Helpers

The following custom helpers are available in templates:

- `eq`: Compares two values (`{{#eq value1 value2}}...{{else}}...{{/eq}}`)

## Rendering Process

Templates are rendered using the `renderTemplate` function in `mailer.ts`, which:
1. Reads the template HTML file
2. Compiles it with Handlebars
3. Applies the provided context to fill in variables

## Testing

For testing templates with real data, you can use an Ethereal test account, which is automatically created when SMTP settings are not provided.