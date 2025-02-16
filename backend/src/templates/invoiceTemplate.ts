import { InvoiceByIdResponseData } from "@/@types/invoicesTypes.js";

export function generateInvoiceHtml(params: InvoiceByIdResponseData) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formattedDateIssued = formatDate(params.dateIssued);
  const formattedDueDate = formatDate(params.dueDate);

  return `
<html>
  <head>
    <meta charset="utf-8">
    <title>Rechnung Nr. ${params.invoiceNumber}</title>
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        background-color: #ffffff;
        margin: 0;
      }
      .invoice-container {
        margin: auto;
        background: #ffffff;
        padding: 30px;
      }
      .header {
        text-align: right;
        margin-bottom: 40px;
      }
      .header h1 {
        text-align: right;
        font-size: 2rem;
        margin: 0;
        color: #343a40;
      }
      .header p {
        text-align: right;
        margin: 5px 0;
        font-size: 1rem;
        color: #333853;
      }
      .company-customer {
        display: flex;
        justify-content: space-between;
        margin-bottom: 40px;
      }
      .company, .customer {
        width: 48%;
      }
      .section-title {
        font-size: 1.2rem;
        margin-bottom: 10px;
        font-weight: 500;
        color: #333853;
      }
      .companyName {
        font-size: 1.1rem;
        font-weight: 500;
      }
      .companyInfo {
        font-size: 1rem;
        line-height: 1.4;
        color: #333853;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      table th {
        background-color: #D6E6FE;
        color: black;
      }
      table th, table td {
        padding: 12px 15px;
      }
      table td {
        color: #333853;
      }
      .table-header-start {
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100px;
          width: 100px;
          height: 100%;
          background-color: #D6E6FE;
        }
      }

      .table-row {
        border-bottom: 1px solid #ddd;
      }

      .table-header-end {
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          right: -100px;
          width: 100px;
          height: 100%;
          background-color: #D6E6FE;
        }
      }
      .totals {
        text-align: right;
      }
      .totals p {
        margin: 5px 0;
        font-size: 1.1rem;
        color: #333853;
      }
      .totals .total-amount {
        font-size: 1.4rem;
        font-weight: 500;
        color: #007bff;
        margin: 5px 0;
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <div class="header">
        <h1>Rechnung Nr. ${params.invoiceNumber}</h1>
        <p>Rechnungsdatum: ${formattedDateIssued}</p>
        <p>Fälligkeitsdatum: ${formattedDueDate}</p>
      </div>

      <div class="company-customer">
        <div class="company">
          <div class="section-title">Unternehmen</div>
          <p class="companyName">${params.company.name}</p>
          <p class="companyInfo">${params.company.address || ''}
          <br>
          Telefonnummer: ${params.company.phone || ''}
          <br>
          E-Mail: ${params.company.email || ''}
          <br>
          Website: ${params.company.website || ''}
          <br>
          Steuernummer: ${params.company.taxNumber || ''}
          <br>
          IBAN: ${params.company.bankAccount || ''}
          </p>
        </div>
        <div class="customer">
          <div class="section-title">Kunde</div>
          <p class="companyName">${params.customer.firstName} ${params.customer.lastName}</p>
          <p class="companyInfo">
            ${params.customer.address ? `${params.customer.address}<br>` : ''}
            ${params.customer.email ? `Email: ${params.customer.email}<br>` : ''}
            ${params.customer.phone ? `Telefonnummer: ${params.customer.phone}<br>` : ''}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: left;" class="table-header-start">Produkt oder Service</th>
            <th style="text-align: right;">Anzahl</th>
            <th style="text-align: right;">Einzelpreis</th>
            <th style="text-align: right;">Steuersatz</th>
            <th style="text-align: right;" class="table-header-end">Gesamtpreis</th>
          </tr>
        </thead>
        <tbody>
          ${params.servicesItems?.map(item => `
            <tr key=${item.id} class="table-row">
              <td style="text-align: left;">${item.serviceName}</td>
              <td style="text-align: right;">${item.serviceQuantity}</td>
              <td style="text-align: right;">${item.servicePrice} ${params.currency === 'EUR' ? '€' : ''}</td>
              <td style="text-align: right;">${Number(item.serviceTaxRate).toFixed(0)}%</td>
              <td style="text-align: right;">${item.serviceTotalAmount} ${params.currency === 'EUR' ? '€' : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <p>Zwischensumme: ${params.subtotal} ${params.currency === 'EUR' ? '€' : '' }</p>
        <p>Steuersumme: ${params.taxes} ${params.currency === 'EUR' ? '€' : ''}</p>
        <p class="total-amount">Rechnungsbetrag: ${params.totalAmount} ${params.currency === 'EUR' ? '€' : ''}</p>
      </div>
    </div>
  </body>
</html>
  `;
}
