/* eslint-disable no-unused-vars */
import { 
  AddCircle,
  ArrowBackIos,
  Cancel,
} from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl, 
  FormLabel,
  FormControlLabel,
  FormHelperText,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  IconButton,
  Checkbox,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  createFilterOptions,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import "dayjs/locale/de";

dayjs.locale(`de`);

const filter = createFilterOptions();

const daysToPay = [
  { value: 0, name: `Today` },
  { value: 1, name: `1` },
  { value: 7, name: `7` },
  { value: 14, name: `14` },
  { value: 30, name: `30` },
  { value: 60, name: `60` },
  { value: 90, name: `90` },
];

export default function InvoiceForm({
  invoice,
  customers,
  services,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  removeServiceErrorIndex,
  isPending,
}) {
  const isEditMode = Boolean(invoice);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [formData, setFormData] = useState({
    customerId: isEditMode && invoice?.customerId ? invoice.customerId : ``,
    isNewCustomer: false,
    salutation: null,
    firstName: ``,
    lastName: ``,
    email: ``,
    phone: ``,
    dateIssued: dayjs(),
    dueDate: daysToPay[0].value,
    services: [{
      id: '',
      name: '',
      price: ``,
      quantity: 1,
      taxRate: `19`,
      isTaxesIncluded: true,
    }],
    subtotal: ``,
    taxes: ``,
    total: ``,
  });

  console.log(`formErrors`, JSON.stringify(formErrors, null, 4));

  /** TODO: Use AutoComplete for service prices, if they are more than 1
   create a new state for service prices like this:
   const [servicePrices, setServicePrices] = useState([
    [{id: '', price: ''}, {id: '', price: ''}],
    [{id: '', price: ''}, {id: '', price: ''}],
   ]);
   where the first array is for the first service and the second array is for the second service in formData.services
 */

  useEffect(() => {
    console.log(`formData.services: `, JSON.stringify(formData.services, null, 4));
    
  }, [formData]);

  useEffect(() => {
    return () => cleanErrors()
  }, []);

  const handleRemoveService = (index) => {
    removeServiceErrorIndex(index);

    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleAddService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: '',
          name: '',
          price: ``,
          quantity: 1,
          taxRate: `19`,
          isTaxesIncluded: true,
        },
      ],
    }));
  };

  const handleServiceFieldChange = (index, fieldName, value) => {
    if(
      formErrors?.services?.length > 0 &&
      formErrors?.services[index] &&
      formErrors?.services[index][fieldName]
    ) {
      cleanError(`services[${index}][${fieldName}]`);
    }

    setFormData((prev) => {
      const updatedServices = [...prev.services];
      updatedServices[index] = {
        ...updatedServices[index],
        [fieldName]: value,
      };
      return {
        ...prev,
        services: updatedServices,
      };
    });
  };

  const handleServiceAutocompleteChange = (_event, newValue, index) => {   
    if (!newValue) {
      handleServiceFieldChange(index, `id`, ``);
      handleServiceFieldChange(index, `name`, ``);
      return;
    }

    if (typeof newValue === "string") {
      handleServiceFieldChange(index, "id", "");
      handleServiceFieldChange(index, "name", newValue);
      return;
    }

    handleServiceFieldChange(index, "id", newValue.id);
    handleServiceFieldChange(index, "name", newValue.name);
    handleServiceFieldChange(index, "price", newValue.employeePrices[0].price.toString());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if(formErrors && formErrors[name]) {
      cleanError(name);
    }
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDateChange = (newValue) => {
    if (formErrors?.dateIssued) {
      cleanError(`dateIssued`);
    }
  
    setFormData((prev) => ({
      ...prev,
      dateIssued: newValue,
    }));
  };

  const handleCustomerChange = (_event, newValue) => {
    if (newValue?.isCreateNew) {
      handleCreateClientClick();

      return;
    }

    const customerId = newValue ? newValue.id : ``;

    setFormData((prevData) => ({
      ...prevData,
      customerId: customerId,
    }));

    if (formErrors?.customerId) {
      cleanError(`customerId`);
    }
  };

  const handleChooseClientClick = () => {
    setIsNewCustomer(false);

    setFormData((prevData) => ({
      ...prevData,
      isNewCustomer: false,
    }));

    if (formErrors?.customerId) {
      cleanError(`customerId`);
    }
  };

  const handleCreateClientClick = () => {
    setIsNewCustomer(true);

    setFormData((prevData) => ({
      ...prevData,
      isNewCustomer: true,
    }));

    if (formErrors?.customerId) {
      cleanError(`customerId`);
    }
  };

  const selectedCustomer = customers.find(
    (customer) => customer.id === formData.customerId
  ) || null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(`SUBMIT formData`, JSON.stringify(formData, null, 4));
    await submitForm({
      // ...invoice,
      ...formData,
    });
  };

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: 2.2,
      }}
    >
      <Typography
        variant="h5"
      >
        Client
      </Typography>

      {!isNewCustomer && <FormControl
        error={Boolean(formErrors?.customerId)}
        size="small"
        sx={{
          display: `flex`,
          flexDirection: `row`,
          alignItems: `center`,
          gap: 2,
        }}
      >
        <Autocomplete
          sx={{ flexGrow: 1 }}
          options={customers}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => {
            if (option.isCreateNew) {
              return option.label;
            }
            return `${option.lastName} ${option.firstName} ${option.email}`;
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            if (filtered.length === 0) {
              filtered.push({
                label: "Create New Client",
                isCreateNew: true,
              });
            }
            return filtered;
          }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;

            if (option.isCreateNew) {
              return (
                <li
                  key={key}
                  {...otherProps}
                  style={{ fontWeight: "bold" }}
                >
                  {option.label}
                </li>
              );
            }
            return (
              <li {...otherProps} key={key} style={{display: `flex`, flexDirection: `column`, alignItems: `flex-start`}}>
                {option.lastName} {option.firstName}

                <Typography variant="body2" color="text.secondary">
                  {option.email}
                </Typography>
              </li>
            );
          }}
          value={selectedCustomer}
          onChange={handleCustomerChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Customer"
            />
          )}
        />

        <IconButton
          color="secondary"
          onClick={handleCreateClientClick}
        >
          <AddCircle />
        </IconButton>
      </FormControl>}

      {formErrors?.customerId && 
        <FormHelperText sx={{width: `100%`, color: `#d32f2f`, mt: `-.8rem`}} >
          {formErrors.customerId}
        </FormHelperText>
      }

      {isNewCustomer && <Box>
        <Button
          type="submit"
          variant="outlined"
          color="secondary"
          onClick={handleChooseClientClick}
        >
          Choose Client From List
        </Button>

        <Box
          sx={{
            display: `flex`,
            flexDirection: `column`,
            gap: 2.2,
            mt: 2,
          }}
        >
          <FormControl error={Boolean(formErrors?.salutation)}>
            <Box sx={{
              display: `flex`,
              flexDirection: `row`,
              alignItems: `center`,
              gap: 3,
            }}>
              <FormLabel 
                id="salutation-group-label"
                sx={{ mr: 4 }}
              >
                Salutation
              </FormLabel>

              <RadioGroup
                row
                name="salutation"
                value={formData.salutation}
                onChange={handleChange}
              >
                <FormControlLabel value={1} control={
                  <Radio color="info" disabled={isPending} />
                } label="Miss"  />

                <FormControlLabel value={0} control={
                  <Radio color="info" disabled={isPending} />
                } label="Mister" />
              </RadioGroup>
            </Box>

            {formErrors?.salutation && 
              <FormHelperText>
                {formErrors.salutation}
              </FormHelperText>
            }
          </FormControl>

          <FormControl error={Boolean(formErrors?.lastName)}>
            <TextField
              value={formData.lastName}
              label="Last Name"
              variant="outlined"
              name="lastName"
              onChange={handleChange}
              disabled={isPending}
            />

            {formErrors?.lastName && 
              <FormHelperText>
                {formErrors.lastName}
              </FormHelperText>
            }
          </FormControl>
      
          <FormControl error={Boolean(formErrors?.firstName)}>
            <TextField
              value={formData.firstName}
              label="First Name"
              variant="outlined"
              name="firstName"
              onChange={handleChange}
              disabled={isPending}
            />

            {formErrors?.firstName && 
              <FormHelperText>
                {formErrors.firstName}
              </FormHelperText>
            }
          </FormControl>

          <FormControl error={Boolean(formErrors?.email)}>
            <TextField
              value={formData.email}
              label="Email"
              variant="outlined"
              name="email"
              onChange={handleChange}
              disabled={isPending}
            />

            {formErrors?.email && 
              <FormHelperText>
                {formErrors.email}
              </FormHelperText>
            }
          </FormControl>

          <FormControl error={Boolean(formErrors?.phone)}>
            <TextField
              value={formData.phone}
              label="Phone"
              variant="outlined"
              name="phone"
              onChange={handleChange}
              disabled={isPending}
            />

            {formErrors?.phone && 
              <FormHelperText>
                {formErrors.phone}
              </FormHelperText>
            }
          </FormControl>
        </Box>
      </Box>}

      <Typography
        variant="h5"
      >
        Date
      </Typography>

      <Box sx={{ display: `flex`, gap: `1rem` }}>
        <FormControl error={Boolean(formErrors?.dateIssued)}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
            <DatePicker
              label="Invoice Date"
              value={formData.dateIssued}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </FormControl>

        <FormControl sx={{ flexGrow: 1 }}>
          <InputLabel id="due-date-select-label">Days to pay:</InputLabel>

          <Select
            labelId="due-date-select-label"
            id="due-date-select"
            value={formData.dueDate}
            label="Days to pay:"
            name="dueDate"
            onChange={handleChange}
            MenuProps={{
              style: {
                maxHeight: 400,
              },
            }}
          >
            {daysToPay.map((day) => (
              <MenuItem key={day.value} value={day.value}>
                {day.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Typography
        variant="h5"
      >
        Services
      </Typography>

      <Box>
        {formData.services.map((service, index, servicesArray) => {
          return <Box 
            key={index}
            sx={{
              position: `relative`,
              pt: `1rem`,
              pb: `1rem`,
              '&::before': {
                content: `""`,
                display: `block`,
                height: `calc(100%)`,
                width: `calc(100% + 2rem)`,
                position: `absolute`,
                top: 0,
                left: `-1rem`,
                backgroundColor: index % 2 === 0 ? `#f5f5f5` : `#e4e4e4`,
                zIndex: -1,
              },
            }}
          >
            <Box sx={{ display: `flex`, gap: `.5rem` }}>
              <IconButton
                color="error"
                onClick={() => handleRemoveService(index)}
                sx={{
                  padding: 0,
                  alignSelf: `flex-start`,
                  mt: `16px`,
                }}
                disabled={servicesArray.length === 1}
              >
                <Cancel />
              </IconButton>

              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: `bold`, 
                  textAlign: `center`, 
                  width: `3rem`,
                }}
              >
              # <br />
                {index + 1}
              </Typography>

              <FormControl 
                sx={{width: `100%`}}
                error={Boolean(formErrors?.services?.length > 0 && formErrors?.services[index]?.name)}
              >
                <Autocomplete
                  freeSolo
                  options={services}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    return filtered;
                  }}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") {
                      return option;
                    }

                    return option.name;
                  }}
                  value={service.id
                    ? services.find((s) => s.id === service.id) || service.name
                    : service.name}
                  onInputChange={(_event, newInputValue) => {
                    handleServiceFieldChange(index, `id`, ``);
                    handleServiceFieldChange(index, `name`, newInputValue);
                  }}
                  onChange={(event, value)=>handleServiceAutocompleteChange(event, value, index)}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;

                    return (
                      <li {...otherProps} key={key}>
                        {option.name}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Service Name"
                      variant="outlined"
                    />
                  )}
                />

                {formErrors?.services?.length > 0 && formErrors?.services[index]?.name && 
              <FormHelperText>
                {formErrors.services[index].name}
              </FormHelperText>
                }
              </FormControl>
            </Box>

            <Box sx={{
              display: `flex`,
              gap: `1rem`,
              mt: `2rem`,
              alignItems: `flex-start`,
            }}>
              <FormControl 
                error={Boolean(formErrors?.services?.length > 0 && formErrors?.services[index]?.quantity)}
                sx={{position: `relative`, flexGrow: 1}}
              >
                <TextField
                  value={service.quantity}
                  label="Quantity"
                  variant="outlined"
                  name="subtotal"
                  onChange={(event) => handleServiceFieldChange(index, `quantity`, event.target.value)}
                  disabled={isPending}
                  InputProps={{
                    readOnly: true,
                  }}
                />

                {formErrors?.services?.length > 0 && formErrors?.services[index]?.quantity && 
                <FormHelperText>
                  {formErrors.services[index].quantity}
                </FormHelperText>
                }

                <IconButton
                  color="primary"
                  onClick={() => handleServiceFieldChange(index, `quantity`, Number(service.quantity) + 1)}
                  sx={{
                    position: `absolute`, right: `15px`, top: `-13px`, transform: `rotate(90deg)`,
                    height: `55px`,
                    width: `27px`,
                    border: `none`,
                    padding: 0,
                    margin: 0,
                    borderRadius: 0,
                    borderRight: `1px solid #ddd`,
                    borderBottom: `1px solid #ddd`,
                    paddingLeft: `12px`,
                  }}
                >
                  <ArrowBackIos />
                </IconButton>

                <IconButton
                  color="primary"
                  onClick={() => handleServiceFieldChange(index, `quantity`, Number(service.quantity) > 1 ? Number(service.quantity) - 1 : 1)}
                  sx={{
                    position: `absolute`, right: `15px`, bottom: `-13px`, transform: `rotate(-90deg)`,
                    height: `55px`,
                    width: `27px`,
                    border: `none`,
                    padding: 0,
                    margin: 0,
                    borderRadius: 0,
                    borderRight: `1px solid #ddd`,
                    borderTop: `1px solid #ddd`,
                    paddingLeft: `12px`,
                  }}
                >
                  <ArrowBackIos />
                </IconButton>
              </FormControl>

              <FormControl error={Boolean(formErrors?.services?.length > 0 && formErrors?.services[index]?.price)} sx={{ flexGrow: 1 }}>
                <InputLabel htmlFor="outlined-adornment-password">Price</InputLabel>

                <OutlinedInput
                  value={service.price}
                  label="Price"
                  name="subtotal"
                  endAdornment={<InputAdornment position="end"> € </InputAdornment>}
                  onChange={(event) => handleServiceFieldChange(index, `price`, event.target.value)}
                  disabled={isPending}
                  type="text" 
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9]+([.,][0-9]+)?'
                  }}
                />

                {formErrors?.services?.length > 0 && formErrors?.services[index]?.price && 
                <FormHelperText>
                  {formErrors.services[index].price}
                </FormHelperText>
                }
              </FormControl>

              <FormControl error={Boolean(formErrors?.services?.length > 0 && formErrors?.services[index]?.taxRate)} sx={{ flexGrow: 1 }}>
                <InputLabel htmlFor="outlined-adornment-password">Tax MwSt.</InputLabel>

                <OutlinedInput
                  value={service.taxRate}
                  label="Tax MwSt."
                  endAdornment={<InputAdornment position="end"> % </InputAdornment>}
                  name="taxRate"
                  type="text" 
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9]+([.,][0-9]+)?'
                  }}
                  onChange={(event) => handleServiceFieldChange(index, `taxRate`, event.target.value)}
                  disabled={isPending}
                />

                {formErrors?.services?.length > 0 && formErrors?.services[index]?.taxRate && 
                <FormHelperText>
                  {formErrors.services[index].taxRate}
                </FormHelperText>
                }
              </FormControl>
            </Box>

            <Box sx={{ display: `flex`,justifyContent: `flex-end`}}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={service.isTaxesIncluded}
                    onChange={(event) => handleServiceFieldChange(index, `isTaxesIncluded`, event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                }
                labelPlacement="start"
                label="Tax included in Price"
              />
            </Box>
          </Box>
        })}
      </Box>

      <Button
        type="button"
        onClick={handleAddService}
        variant="text"
        color="secondary"
        size="large"
        endIcon={<AddCircle size={30} />}
        sx={{ 
          alignSelf: `flex-end`,
          padding: 0,
        }}
      >
        Add Item
      </Button>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: `20px` }}
        disabled={isPending}
        endIcon={isPending && <CircularProgress size={16} />}
      >
        Save
      </Button>
    </Box>
  );
}
