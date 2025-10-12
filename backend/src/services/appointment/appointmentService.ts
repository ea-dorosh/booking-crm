import {
  Pool,
  ResultSetHeader,
} from 'mysql2/promise';
import {
  AppointmentRowType,
  AppointmentDataType,
  AppointmentDetailsRowType,
  AppointmentDetailType,
  AppointmentFormDataType,
  CreateAppointmentServiceResponseErrorType,
  CreateAppointmentServiceResponseSuccessType,
  AppointmentFormDataServiceType,
} from '@/@types/appointmentsTypes.js';
import { CompanyResponseData } from '@/@types/companyTypes.js';
import {
  AppointmentStatusEnum,
  DEFAULT_APPOINTMENT_SORT_FIELD,
  CustomerNewStatusEnum,
} from '@/enums/enums.js';
import {
  Date_ISO_Type,
  Time_HH_MM_SS_Type,
  SortDirection,
  AppointmentSortField,
} from '@/@types/utilTypes.js';
import { getCompany } from '@/services/company/companyService.js';
import {
  checkEmployeeTimeNotOverlap,
  getEmployee,
  getEmployees,
} from '@/services/employees/employeesService.js';
import {
  fromMySQLToISOString,
  getServiceDuration,
  fromDayjsToMySQLDateTime,
} from '@/utils/timeUtils.js';
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '@/services/googleCalendar/googleCalendarService.js';
import {
  validateAppointmentDetailsData,
} from '@/validators/appointmentValidators.js';
import { getService } from '@/services/service/serviceService.js';
import { ServiceDetailsDataType } from '@/@types/servicesTypes.js';
import {
  checkCustomerExists,
  createCustomer,
  updateCustomerConsents,
} from '@/services/customer/customerService.js';
import { validateCustomerData } from '@/validators/customersValidators.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { getAppointmentEndTime } from '@/services/calendar/calendarUtils.js';
import {
  formatName,
  formatPhone,
} from '@/utils/formatters.js';
import { sendAppointmentConfirmationEmail, sendAppointmentNotificationEmail } from '@/mailer/mailer.js';
import { getEmployeeGoogleCalendarEvents } from '@/services/googleCalendar/googleCalendarService.js';

interface GetAppointmentsOptions {
  startDate: Date_ISO_Type;
  endDate?: Date_ISO_Type | null;
  status?: AppointmentStatusEnum | null;
  employeeIds?: number[] | null;
  sortBy?: AppointmentSortField;
  sortOrder?: SortDirection;
  includeGoogleEvents?: boolean;
}

interface CombinedAppointmentData extends AppointmentDataType {
  isGoogleEvent?: boolean;
  googleEventId?: string;
}

async function getAppointments(
  dbPool: Pool,
  options: GetAppointmentsOptions,
): Promise<CombinedAppointmentData[]> {

  const finalOptions: GetAppointmentsOptions = {
    sortBy: DEFAULT_APPOINTMENT_SORT_FIELD,
    sortOrder: `asc`,
    includeGoogleEvents: false,
    ...options,
  };

  const {
    startDate, endDate, status, employeeIds, sortBy, sortOrder, includeGoogleEvents,
  } = finalOptions;

  // Build dynamic WHERE clause
  const whereConditions: string[] = [`date >= ?`];
  const queryParams: any[] = [startDate];

  if (endDate) {
    whereConditions.push(`date <= ?`);
    queryParams.push(endDate);
  }

  if (status !== null && status !== undefined) {
    whereConditions.push(`status = ?`);
    queryParams.push(status);
  }

  if (employeeIds !== null && employeeIds !== undefined && employeeIds.length > 0) {
    const placeholders = employeeIds.map(() => `?`).join(`, `);
    whereConditions.push(`employee_id IN (${placeholders})`);
    queryParams.push(...employeeIds);
  }

  // Build ORDER BY clause
  const orderByColumn = sortBy === `created_date` ? `created_date` : `date`;
  const orderDirection = sortOrder === `desc` ? `DESC` : `ASC`;

  const sql = `
    SELECT *, google_calendar_event_id
    FROM SavedAppointments
    WHERE ${whereConditions.join(` AND `)}
    ORDER BY ${orderByColumn} ${orderDirection}
  `;

  const [appointmentsResults] = await dbPool.query<AppointmentRowType[]>(sql, queryParams);

  const appointmentsData: AppointmentDataType[] = appointmentsResults.map((row) => {
    return {
      id: row.id,
      date: fromMySQLToISOString(row.date),
      timeStart: fromMySQLToISOString(row.time_start),
      timeEnd: fromMySQLToISOString(row.time_end),
      createdDate: fromMySQLToISOString(row.created_date),
      serviceName: row.service_name,
      serviceDuration: row.service_duration,
      customerLastName: row.customer_last_name,
      customerFirstName: row.customer_first_name,
      status: row.status,
      orderMessage: row.order_message ?? null,
      customer: {
        id: row.customer_id,
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        isCustomerNew: row.is_customer_new === CustomerNewStatusEnum.Existing ? false : true,
      },
      employee: {
        id: row.employee_id,
        firstName: ``,
        lastName: ``,
      },
    };
  });

  const employees = await getEmployees(dbPool);

  appointmentsData.forEach((appointment) => {
    appointment.employee.firstName = employees.find((employee) => employee.employeeId === appointment.employee.id)?.firstName;
    appointment.employee.lastName = employees.find((employee) => employee.employeeId === appointment.employee.id)?.lastName;
  });

  // Add Google Calendar events if exactly one employee is selected and includeGoogleEvents is true
  if (includeGoogleEvents && employeeIds && employeeIds.length === 1 && endDate) {
    try {
      const googleEvents = await getEmployeeGoogleCalendarEvents(
        dbPool,
        employeeIds[0],
        startDate,
        endDate,
      );

      // Get all appointment Google Calendar event IDs to avoid duplicates
      const appointmentGoogleEventIds = new Set(
        appointmentsResults
          .map(row => row.google_calendar_event_id)
          .filter(Boolean),
      );

      // Convert Google Calendar events to appointment format
      const googleAppointments: CombinedAppointmentData[] = googleEvents
        .filter(googleEvent => !appointmentGoogleEventIds.has(googleEvent.id))
        .map(googleEvent => {
          // Calculate duration in seconds (to match database format)
          const startTime = new Date(googleEvent.start);
          const endTime = new Date(googleEvent.end);
          const durationMs = endTime.getTime() - startTime.getTime();
          const serviceDuration = Math.floor(durationMs / 1000); // Convert to seconds

          return {
            id: 0, // Google events don't have internal IDs
            date: googleEvent.start.split(`T`)[0],
            createdDate: new Date().toISOString(),
            serviceName: googleEvent.summary,
            timeStart: googleEvent.start,
            timeEnd: googleEvent.end,
            serviceDuration,
            customerLastName: ``,
            customerFirstName: ``,
            status: AppointmentStatusEnum.Active,
            customer: {
              id: 0,
              firstName: ``,
              lastName: ``,
              isCustomerNew: false,
            },
            employee: {
              id: employeeIds[0],
              firstName: employees.find(emp => emp.employeeId === employeeIds[0])?.firstName || ``,
              lastName: employees.find(emp => emp.employeeId === employeeIds[0])?.lastName || ``,
            },
            isGoogleEvent: true,
            googleEventId: googleEvent.id,
            orderMessage: googleEvent.description || null,
          };
        });

      // Combine appointments and Google events
      const combinedData = [...appointmentsData, ...googleAppointments];

      // Sort combined data if needed
      if (sortBy === `date`) {
        combinedData.sort((a, b) => {
          const dateA = new Date(a.timeStart);
          const dateB = new Date(b.timeStart);
          return sortOrder === `desc` ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });
      }

      return combinedData;
    } catch (error) {
      console.error(`Error fetching Google Calendar events:`, error);
      // Return only appointments if Google Calendar fetch fails
      return appointmentsData;
    }
  }

  return appointmentsData;
}

async function getAppointment(dbPool: Pool, appointmentId: number): Promise<AppointmentDetailType> {
  const sql = `
    SELECT *
    FROM SavedAppointments
    WHERE id = ?
  `;

  const [results] = await dbPool.query<AppointmentDetailsRowType[]>(sql, [appointmentId]);

  const appointment: AppointmentDetailType[] = results.map((row) => {
    return {
      id: row.id,
      date: fromMySQLToISOString(row.date),
      timeStart: fromMySQLToISOString(row.time_start),
      timeEnd: fromMySQLToISOString(row.time_end),
      serviceDuration: row.service_duration,
      serviceId: row.service_id,
      serviceName: row.service_name,
      createdDate: fromMySQLToISOString(row.created_date),
      employee: {
        id: row.employee_id,
        firstName: ``,
        lastName: ``,
      },
      customer: {
        id: row.customer_id,
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        isCustomerNew: row.is_customer_new === CustomerNewStatusEnum.Existing ? false : true,
      },
      status: row.status,
      googleCalendarEventId: row.google_calendar_event_id,
      location: row.location,
      orderMessage: row.order_message ?? null,
    };
  });

  const employee = await getEmployee(dbPool, appointment[0].employee.id);

  appointment[0].employee = {
    ...appointment[0].employee,
    firstName: employee.firstName,
    lastName: employee.lastName,
  };

  return appointment[0];
}

async function getAppointmentsForCalendar(
  dbPool: Pool,
  dates: Date_ISO_Type[],
  employeeIds: number[],
  status: AppointmentStatusEnum,
): Promise<AppointmentDataType[]> {
  const savedAppointmentsQuery = `
    SELECT * FROM SavedAppointments
    WHERE date IN (${dates.map(() => `?`).join(`,`)})
    AND employee_id IN (${employeeIds.map(() => `?`).join(`,`)})
    AND status = ?
  `;

  const [appointmentResults] = await dbPool.query<AppointmentRowType[]>(savedAppointmentsQuery, [
    ...dates,
    ...employeeIds,
    status,
  ]);

  const appointmentsData: AppointmentDataType[] = appointmentResults.map((row) => {
    return {
      id: row.id,
      date: fromMySQLToISOString(row.date),
      createdDate: fromMySQLToISOString(row.created_date),
      serviceName: row.service_name,
      timeStart: fromMySQLToISOString(row.time_start),
      timeEnd: fromMySQLToISOString(row.time_end),
      serviceDuration: row.service_duration,
      customerLastName: row.customer_last_name,
      customerFirstName: row.customer_first_name,
      status: row.status,
      customer: {
        id: row.customer_id,
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        isCustomerNew: row.is_customer_new === CustomerNewStatusEnum.Existing ? false : true,
      },
      employee: {
        id: row.employee_id,
      },
    };
  });

  return appointmentsData;
}

async function cancelAppointment(dbPool: Pool, appointment: AppointmentDetailType): Promise<void> {
  const sql = `
    UPDATE SavedAppointments
    SET status = ?
    WHERE id = ?
  `;

  await dbPool.query(sql, [AppointmentStatusEnum.Canceled, appointment.id]);

  if (appointment.googleCalendarEventId) {
    try {
      await deleteGoogleCalendarEvent(dbPool, appointment.employee.id, appointment.googleCalendarEventId);
    } catch (error) {
      console.error(`Error deleting Google Calendar event:`, error);
      throw error;
    }
  }
}

const ERROR_MESSAGE = {
  VALIDATION_FAILED: `Validation failed`,
  GENERAL_ERROR_MESSAGE: `Beim Erstellen des Datensatzes ist ein Fehler aufgetreten, bitte versuchen Sie es erneut oder versuchen Sie es später noch einmal.`,
  EMPLOYEE_IS_ALREADY_BUSY: `Leider hat sich schon jemand die Zeit genommen. Versuchen Sie, eine andere Zeit oder einen anderen Tag zu wählen und versuchen Sie es erneut`,
};

async function createAppointment(dbPool: Pool, appointment: AppointmentFormDataType): Promise<
CreateAppointmentServiceResponseErrorType | CreateAppointmentServiceResponseSuccessType
> {
  const invalidAppointmentDetailsData = validateAppointmentDetailsData(appointment);

  if (Object.keys(invalidAppointmentDetailsData).length > 0) {
    return {
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      errors: invalidAppointmentDetailsData,
    };
  }

  const invalidAppointmentCustomerData = validateCustomerData({
    formData: appointment,
    publicErrors: true,
  });

  if (Object.keys(invalidAppointmentCustomerData).length > 0) {
    return {
      errorMessage: ERROR_MESSAGE.VALIDATION_FAILED,
      validationErrors: invalidAppointmentCustomerData,
    };
  }

  /** check customer already exists and create if not */
  let isCustomerNew = CustomerNewStatusEnum.New;
  let customerId: number | null = null;

  const company = await getCompany(dbPool);

  try {
    const checkCustomerResult = await checkCustomerExists(dbPool, {
      email: appointment.email,
      customerId: null,
    });

    if (checkCustomerResult.exists) {
      isCustomerNew = CustomerNewStatusEnum.Existing;
      customerId = checkCustomerResult.customerId;

      // Update consents for returning customers if provided (idempotent)
      try {
        await updateCustomerConsents(dbPool, customerId!, {
          consentPrivacy: appointment.consentPrivacy,
          consentMarketing: appointment.consentMarketing,
        });
      } catch (error) {
        console.error(`Failed to update customer consents for existing customer ${customerId}:`, error);
      }
    } else {
      const { newCustomerId } = await createCustomer(dbPool, appointment);

      customerId = newCustomerId;
    }
  } catch (error) {
    return {
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      error: (error as Error).message,
    };
  }

  let firstSavedAppointment: SaveAppointmentResult | CreateAppointmentServiceResponseErrorType | null = null;

  firstSavedAppointment = await saveAppointment(dbPool, {
    service: appointment.service,
    date: appointment.date,
    customer: {
      id: customerId!,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      email: appointment.email,
      phone: appointment.phone,
      isCustomerNew,
    },
    company,
    orderMessage: appointment.orderMessage || null,
  });

  if (`errorMessage` in firstSavedAppointment || !firstSavedAppointment) {
    return firstSavedAppointment;
  }

  let secondSavedAppointment: SaveAppointmentResult | CreateAppointmentServiceResponseErrorType | null = null;

  if (appointment.service.secondService) {
    secondSavedAppointment = await saveAppointment(dbPool, {
      service: appointment.service.secondService,
      date: appointment.date,
      customer: {
        id: customerId!,
        firstName: appointment.firstName,
        lastName: appointment.lastName,
        email: appointment.email,
        phone: appointment.phone,
        isCustomerNew,
      },
      company,
      orderMessage: appointment.orderMessage || null,
    });
  }

  if (secondSavedAppointment !== null && `errorMessage` in secondSavedAppointment) {
    return secondSavedAppointment;
  }

  try {
    const googleEventId = await createGoogleCalendarEvent(
      dbPool,
      {
        employeeId: appointment.service.employeeIds[0], // TODO: create logic for selecting from employeeIds array
        id: firstSavedAppointment.appointmentId,
        customerId: Number(customerId),
        customerName: `${formatName(appointment.firstName)} ${formatName(appointment.lastName)}`,
        serviceName: firstSavedAppointment.serviceName,
        timeStart: firstSavedAppointment.timeStartUTC,
        timeEnd: firstSavedAppointment.timeEndUTC,
        location: `${company.branches[0].addressStreet}, ${company.branches[0].addressZip} ${company.branches[0].addressCity}`,
      },
    );

    if (googleEventId) {
      const updateGoogleEventQuery = `
        UPDATE SavedAppointments
        SET google_calendar_event_id = ?
        WHERE id = ?
      `;
      await dbPool.query(updateGoogleEventQuery, [googleEventId, firstSavedAppointment.appointmentId]);
    }
  } catch (error) {
    console.error(`Failed to create Google Calendar event for first appointment:`, error);
  }

  if (secondSavedAppointment !== null) {
    try {
      const googleEventId = await createGoogleCalendarEvent(
        dbPool,
        {
          employeeId: appointment.service.employeeIds[0], // TODO: create logic for selecting from employeeIds array
          id: secondSavedAppointment.appointmentId,
          customerId: Number(customerId),
          customerName: `${formatName(appointment.firstName)} ${formatName(appointment.lastName)}`,
          serviceName: secondSavedAppointment.serviceName,
          timeStart: secondSavedAppointment.timeStartUTC,
          timeEnd: secondSavedAppointment.timeEndUTC,
          location: `${company.branches[0].addressStreet}, ${company.branches[0].addressZip} ${company.branches[0].addressCity}`,
        },
      );

      if (googleEventId) {
        const updateGoogleEventQuery = `
          UPDATE SavedAppointments
          SET google_calendar_event_id = ?
          WHERE id = ?
        `;
        await dbPool.query(updateGoogleEventQuery, [googleEventId, secondSavedAppointment.appointmentId]);
      }
    } catch (error) {
      console.error(`Failed to create Google Calendar event for second appointment:`, error);
    }
  }

  try {
    const employee = await getEmployee(dbPool, appointment.service.employeeIds[0]); // TODO: create logic for selecting from employeeIds array

    const confirmationEmailPayload: any = {
      recipientEmail: appointment.email,
      appointmentData: {
        location: `${company.branches[0].addressStreet}, ${company.branches[0].addressZip} ${company.branches[0].addressCity}`,
        lastName: formatName(appointment.lastName),
        firstName: formatName(appointment.firstName),
        phone: formatPhone(appointment.phone),
        email: appointment.email,
      },
      firstServiceData:{
        date:  dayjs.tz(`${appointment.date} 12:00:00`, `Europe/Berlin`).format(`DD.MM.YYYY`),
        time: dayjs.tz(firstSavedAppointment.timeStartUTC, `Europe/Berlin`).format(`HH:mm`),
        service: firstSavedAppointment.serviceName,
        specialist: `${employee.firstName} ${employee.lastName}`,
      },
      companyData: company,
    }

    if (secondSavedAppointment) {
      confirmationEmailPayload.secondServiceData = {
        date: dayjs.tz(`${appointment.date} 12:00:00`, `Europe/Berlin`).format(`DD.MM.YYYY`),
        time: dayjs.tz(secondSavedAppointment.timeStartUTC, `Europe/Berlin`).format(`HH:mm`),
        service: secondSavedAppointment.serviceName,
        specialist: `${employee.firstName} ${employee.lastName}`,
      }
    }

    const emailResult = await sendAppointmentConfirmationEmail(confirmationEmailPayload);
    console.log(`Confirmation email sent to ${appointment.email}`);

    if (emailResult?.previewUrl) {
      console.log(`Email preview available at: ${emailResult.previewUrl}`);
    }
  } catch (error) {
    console.error(`Failed to send confirmation email for appointment ${firstSavedAppointment.appointmentId}: `, error);
  }

  // Send notification email to salon
  try {
    const employee = await getEmployee(dbPool, appointment.service.employeeIds[0]); // TODO: create logic for selecting from employeeIds array
    const salonEmail = company.branches[0].email;

    const notificationEmailPayload: any = {
      recipientEmail: salonEmail,
      appointmentData: {
        location: `${company.branches[0].addressStreet}, ${company.branches[0].addressZip} ${company.branches[0].addressCity}`,
        lastName: formatName(appointment.lastName),
        firstName: formatName(appointment.firstName),
        phone: formatPhone(appointment.phone),
        email: appointment.email,
        isCustomerNew: isCustomerNew === CustomerNewStatusEnum.New,
      },
      firstServiceData:{
        date:  dayjs.tz(`${appointment.date} 12:00:00`, `Europe/Berlin`).format(`DD.MM.YYYY`),
        time: dayjs.tz(firstSavedAppointment.timeStartUTC, `Europe/Berlin`).format(`HH:mm`),
        service: firstSavedAppointment.serviceName,
        specialist: `${employee.firstName} ${employee.lastName}`,
      },
      companyData: company,
    }

    if (secondSavedAppointment) {
      notificationEmailPayload.secondServiceData = {
        date: dayjs.tz(`${appointment.date} 12:00:00`, `Europe/Berlin`).format(`DD.MM.YYYY`),
        time: dayjs.tz(secondSavedAppointment.timeStartUTC, `Europe/Berlin`).format(`HH:mm`),
        service: secondSavedAppointment.serviceName,
        specialist: `${employee.firstName} ${employee.lastName}`,
      }
    }

    const notificationResult = await sendAppointmentNotificationEmail(notificationEmailPayload);
    console.log(`Notification email sent to salon: ${salonEmail}`);

    if (notificationResult?.previewUrl) {
      console.log(`Salon notification email preview available at: ${notificationResult.previewUrl}`);
    }
  } catch (error) {
    console.error(`Failed to send notification email to salon for appointment ${firstSavedAppointment.appointmentId}: `, error);
  }

  const response: CreateAppointmentServiceResponseSuccessType = {
    date: appointment.date,
    lastName: formatName(appointment.lastName),
    firstName: formatName(appointment.firstName),
    service: {
      id: firstSavedAppointment.appointmentId,
      name: firstSavedAppointment.serviceName,
      timeStart: appointment.service.startTime,
    },
    company: company,
  }

  if (secondSavedAppointment) {
    response.service.secondService = {
      id: secondSavedAppointment.appointmentId,
      name: secondSavedAppointment.serviceName,
      timeStart: appointment.service.secondService?.startTime,
    }
  }

  return response;
}

export interface SaveAppointmentResult {
  appointmentId: number;
  serviceName: string;
  timeStartUTC: dayjs.Dayjs;
  timeEndUTC: dayjs.Dayjs;
  serviceDurationAndBufferTimeInMinutes: Time_HH_MM_SS_Type;
}

const saveAppointment = async (dbPool: Pool, {
  service,
  date,
  customer,
  company,
  orderMessage,
}: {
  service: AppointmentFormDataServiceType;
  date: Date_ISO_Type;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isCustomerNew: CustomerNewStatusEnum;
  };
  company: CompanyResponseData;
  orderMessage?: string | null;
}): Promise<SaveAppointmentResult | CreateAppointmentServiceResponseErrorType> => {
  let serviceName: string = ``;
  let serviceDurationAndBufferTimeInMinutes: Time_HH_MM_SS_Type = `00:00:00`;

  try {
    const serviceDetails: ServiceDetailsDataType = await getService(dbPool, service.serviceId);

    /** save serviceName for response */
    serviceName = serviceDetails.name;

    serviceDurationAndBufferTimeInMinutes = getServiceDuration(
      serviceDetails.durationTime,
      serviceDetails.bufferTime,
    );
  } catch (error) {
    return {
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      error: (error as Error).message,
    };
  }

  const timeStartUTC = dayjs.tz(`${date} ${service.startTime}`, `Europe/Berlin`).utc();
  const timeEndUTC = getAppointmentEndTime(
    timeStartUTC,
    serviceDurationAndBufferTimeInMinutes,
  );

  console.log(`Appointment times calculated:`, {
    timeStartDAYJS: timeStartUTC,
    timeEndDAYJS: timeEndUTC,
    serviceDuration: serviceDurationAndBufferTimeInMinutes,
  });

  try {
    const { isEmployeeAvailable } = await checkEmployeeTimeNotOverlap(
      dbPool,
      {
        date: date,
        employeeId: service.employeeIds[0], // TODO: create logic for selecting from employeeIds array
        timeStart: timeStartUTC,
        timeEnd: timeEndUTC,
      },
    );

    if (!isEmployeeAvailable) {
      return {
        errorMessage: `Erste Service: ${ERROR_MESSAGE.EMPLOYEE_IS_ALREADY_BUSY}`,
      };
    }
  } catch (error) {
    return {
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      error: (error as Error).message,
    };
  }

  const appointmentQuery = `
    INSERT INTO SavedAppointments (
      date,
      time_start,
      time_end,
      service_id,
      service_name,
      customer_id,
      service_duration,
      employee_id,
      created_date,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone,
      is_customer_new,
      google_calendar_event_id,
      location,
      location_id,
      order_message
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const appointmentValues = [
    date,
    fromDayjsToMySQLDateTime(timeStartUTC),
    fromDayjsToMySQLDateTime(timeEndUTC),
    service.serviceId,
    serviceName,
    customer.id,
    serviceDurationAndBufferTimeInMinutes,
    service.employeeIds[0], // TODO: create logic for selecting from employeeIds array
    fromDayjsToMySQLDateTime(dayjs().utc()),
    formatName(customer.firstName),
    formatName(customer.lastName),
    customer.email,
    formatPhone(customer.phone),
    customer.isCustomerNew,
    null, // placeholder for google_calendar_event_id
    `${company.branches[0].addressStreet}, ${company.branches[0].addressZip} ${company.branches[0].addressCity}`,
    company.branches[0].id,
    orderMessage || null,
  ];

  const [appointmentResults] = await dbPool.query<ResultSetHeader>(appointmentQuery, appointmentValues);

  const appointmentId = appointmentResults.insertId;

  return {
    appointmentId,
    serviceName,
    serviceDurationAndBufferTimeInMinutes,
    timeStartUTC,
    timeEndUTC,
  }
}

export {
  getAppointments,
  getAppointment,
  getAppointmentsForCalendar,
  cancelAppointment,
  createAppointment,
};
