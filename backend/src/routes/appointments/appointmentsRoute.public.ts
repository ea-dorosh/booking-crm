import express from 'express';
import { ResultSetHeader } from 'mysql2/promise';
import {
  getServiceDuration,
  fromDayjsToMySQLDateTime
 } from '@/utils/timeUtils.js';
import {
  formatName,
  formatPhone,
} from '@/utils/formatters.js';
import { getService } from '@/services/service/serviceService.js';
import {
  checkCustomerExists,
  createCustomer,
} from '@/services/customer/customerService.js';
import {
  checkEmployeeTimeNotOverlap,
  getEmployee,
} from '@/services/employees/employeesService.js';
import { getCompany } from '@/services/company/companyService.js';
import { getAppointmentEndTime } from '@/routes/calendar/calendarUtils.js';
import { CustomerNewStatusEnum } from '@/enums/enums.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { ServiceDetailsDataType } from '@/@types/servicesTypes.js';
import { AppointmentFormDataType } from '@/@types/appointmentsTypes.js';
import {
  validateAppointmentCustomerData,
  validateAppointmentDetailsData,
} from '@/validators/appointmentValidators.js';
import { sendAppointmentConfirmationEmail } from '@/mailer/mailer.js';
import { createGoogleCalendarEvent } from '@/services/googleCalendar/googleCalendarService.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';

const router = express.Router();

const ERROR_MESSAGE = {
  VALIDATION_FAILED: `Validation failed`,
  GENERAL_ERROR_MESSAGE: `Beim Erstellen des Datensatzes ist ein Fehler aufgetreten, bitte versuchen Sie es erneut oder versuchen Sie es später noch einmal.`,
  EMPLOYEE_IS_ALREADY_BUSY: `Leider hat sich schon jemand die Zeit genommen. Versuchen Sie, eine andere Zeit oder einen anderen Tag zu wählen und versuchen Sie es erneut`,
};

router.post(`/create`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentFormData: AppointmentFormDataType = request.body.appointment;

  const invalidAppointmentDetailsData = validateAppointmentDetailsData(appointmentFormData);
  if (Object.keys(invalidAppointmentDetailsData).length > 0) {
    response.status(428).json({
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      errors: invalidAppointmentDetailsData,
    });
    return;
  }

  const validationErrors = validateAppointmentCustomerData(appointmentFormData, true);

  if (Object.keys(validationErrors).length > 0) {
    response.status(428).json({
        errorMessage: ERROR_MESSAGE.VALIDATION_FAILED,
        validationErrors,
    });
    return;
  }

  let serviceDurationAndBufferTimeInMinutes: Time_HH_MM_SS_Type = `00:00:00`;
  let serviceName: string = ``;

  try {
    const serviceDetails: ServiceDetailsDataType = await getService(request.dbPool, appointmentFormData.serviceId);

    /** save serviceName for response */
    serviceName = serviceDetails.name;

    serviceDurationAndBufferTimeInMinutes = getServiceDuration(serviceDetails.durationTime, serviceDetails.bufferTime);
  } catch (error) {
    response.status(500).json({
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      error: (error as Error).message,
    });
    return;
  }

  /** check customer already exists and create if not */
  let isCustomerNew = CustomerNewStatusEnum.New;
  let customerId;

  try {
    const checkCustomerResult = await checkCustomerExists(request.dbPool, {email: appointmentFormData.email, customerId: null});

    if (checkCustomerResult.exists) {
      isCustomerNew = CustomerNewStatusEnum.Existing;
      customerId = checkCustomerResult.customerId;
    } else {
      const { newCustomerId, validationErrors } = await createCustomer(request.dbPool, appointmentFormData);

      if (validationErrors) {
        response.status(428).json({
            errorMessage: ERROR_MESSAGE.VALIDATION_FAILED, // probably not possible
            validationErrors,
          });
          return;
      } else if (newCustomerId) {
        customerId = newCustomerId;
      }
    }
  } catch (error) {
    response.status(500).json({
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      message: (error as Error).message,
    });
    return;
  }

  const timeStartUTC = dayjs.tz(`${appointmentFormData.date} ${appointmentFormData.time}`, `Europe/Berlin`).utc();
  const timeEndUTC = getAppointmentEndTime(timeStartUTC, serviceDurationAndBufferTimeInMinutes);

  console.log("Appointment times calculated:", {
    timeStart: fromDayjsToMySQLDateTime(timeStartUTC),
    timeEnd: fromDayjsToMySQLDateTime(timeEndUTC),
    serviceDuration: serviceDurationAndBufferTimeInMinutes,
  });

  try {
    const { isEmployeeAvailable } = await checkEmployeeTimeNotOverlap(
      request.dbPool,
      {
        date: appointmentFormData.date,
        employeeId: appointmentFormData.employeeId,
        timeStart: timeStartUTC,
        timeEnd: timeEndUTC,
      },
    );

    if (!isEmployeeAvailable) {
      response.status(409).json({
        errorMessage: ERROR_MESSAGE.EMPLOYEE_IS_ALREADY_BUSY,
      });
      return;
    }
  } catch (error) {
    response.status(500).json({
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      message: (error as Error).message,
    });
    return;
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
      customer_salutation,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone,
      is_customer_new,
      google_calendar_event_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const appointmentValues = [
    appointmentFormData.date,
    fromDayjsToMySQLDateTime(timeStartUTC),
    fromDayjsToMySQLDateTime(timeEndUTC),
    appointmentFormData.serviceId,
    serviceName,
    customerId,
    serviceDurationAndBufferTimeInMinutes,
    appointmentFormData.employeeId,
    fromDayjsToMySQLDateTime(dayjs()),
    appointmentFormData.salutation,
    formatName(appointmentFormData.firstName),
    formatName(appointmentFormData.lastName),
    appointmentFormData.email,
    formatPhone(appointmentFormData.phone),
    isCustomerNew,
    null, // placeholder for google_calendar_event_id
  ];

  try {
    const [appointmentResults] = await request.dbPool.query<ResultSetHeader>(appointmentQuery, appointmentValues);

    const appointmentId = appointmentResults.insertId;

    try {
      const googleEventId = await createGoogleCalendarEvent(
        request.dbPool,
        appointmentFormData.employeeId,
        {
          id: appointmentId,
          customerId: Number(customerId),
          customerName: `${formatName(appointmentFormData.firstName)} ${formatName(appointmentFormData.lastName)}`,
          serviceName: serviceName,
          timeStart: timeStartUTC,
          timeEnd: timeEndUTC,
        }
      );

      if (googleEventId) {
        const updateGoogleEventQuery = `
          UPDATE SavedAppointments
          SET google_calendar_event_id = ?
          WHERE id = ?
        `;
        await request.dbPool.query(updateGoogleEventQuery, [googleEventId, appointmentId]);
      }
    } catch (error) {
      console.error(`Failed to create Google Calendar event:`, error);
    }

    try {
      const employee = await getEmployee(request.dbPool, appointmentFormData.employeeId);
      const company = await getCompany(request.dbPool);

      const emailResult = await sendAppointmentConfirmationEmail(
        appointmentFormData.email,
        {
          date: dayjs.tz(appointmentFormData.date, 'Europe/Berlin').format('DD.MM.YYYY'),
          time: dayjs.tz(timeStartUTC, 'Europe/Berlin').format('HH:mm'),
          service: serviceName,
          specialist: `${employee.firstName} ${employee.lastName}`,
          location: `Harburger Str. 10, 22765 Hamburg`,
          lastName: formatName(appointmentFormData.lastName),
          firstName: formatName(appointmentFormData.firstName),
          phone: formatPhone(appointmentFormData.phone),
          email: appointmentFormData.email,
        },
        company,
      );
      console.log(`Confirmation email sent to ${appointmentFormData.email}`);

      if (emailResult?.previewUrl) {
        console.log(`Email preview available at: ${emailResult.previewUrl}`);
      }
    } catch (error) {
      console.error(`Failed to send confirmation email:`, error);
      throw error;
    }

    response.json({
      message: `Appointment created successfully`,
      data: {
        id: appointmentResults.insertId,
        date: appointmentFormData.date,
        timeStart: timeStartUTC.toISOString(),
        serviceName: serviceName,
        salutation: appointmentFormData.salutation,
        lastName: formatName(appointmentFormData.lastName),
        firstName: formatName(appointmentFormData.firstName)
      }
    });

    return;
  } catch (error) {
    console.error(`Failed to create appointment:`, error);
    response.status(500).json({
      errorMessage: ERROR_MESSAGE.GENERAL_ERROR_MESSAGE,
      message: (error as Error).message,
    });
    return;
  }
});

export default router;