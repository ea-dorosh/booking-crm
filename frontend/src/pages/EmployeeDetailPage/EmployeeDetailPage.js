import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from "react-router-dom";
import CreateEmployeeForm from "@/components/CreateEmployeeForm";
import EmployeeAvailability from "@/components/EmployeeAvailability/EmployeeAvailability";
import { 
  fetchEmployees,
  updateEmployee,
  cleanError,
  cleanErrors,
  resetUpdateFormStatus,
} from '@/features/employees/employeesSlice';

export default function EmployeeDetailPage() {
  const [isEditMode, setIsEditMode] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { employeeId } = useParams();
  const employee = useSelector(state => state.employees.data.find(employee => employee.employeeId === Number(employeeId)));
  const newEmployeeId = useSelector(state => state.employees.updateFormData);
  const formErrors = useSelector(state => state.employees.updateFormErrors);
  const updateFormStatus = useSelector(state => state.employees.updateFormStatus);

  const shouldShowCreateEmployeeForm = employeeId === `create-employee`;

  useEffect(() => {
    if (!employee && !shouldShowCreateEmployeeForm) {
      dispatch(fetchEmployees());
    } else if (shouldShowCreateEmployeeForm) {
      setIsEditMode(true)
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (updateFormStatus === `succeeded`) {
        await dispatch(fetchEmployees());
        setIsEditMode(false);
        dispatch(resetUpdateFormStatus());

        console.log(`newEmployeeId`, newEmployeeId);
        if (newEmployeeId) {
          navigate(`/employees/${newEmployeeId}`);
        }
      }
    })();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFormStatus]);

  const updateEmployeeHandler = (employee) => {
    dispatch(updateEmployee(employee));
  };

  const handleCleanError = (fieldName) => {
    dispatch(cleanError(fieldName));
  };

  const handleCleanErrors = () => {
    dispatch(cleanErrors());
  };

  return (
    <Box sx={{ width: `100%`, maxWidth: 768, padding: `0 20px` }}>
      <Typography variant="h4">{employee ? 
        `Details for ${employee.lastName} ${employee.firstName}` 
        :
        `New employee`
      }</Typography>

      <Divider />

      <Link to={`/`}>Dashboard</Link>

      <Divider />

      <Link to={`/employees`}>Employees</Link>

      <Divider />

      {isEditMode && <Box mt={3}>
        <CreateEmployeeForm
          employee={employee}
          createEmployee={updateEmployeeHandler}
          formErrors={formErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
        />

        <Box mt={2}>
          {!shouldShowCreateEmployeeForm && <Button 
            variant="outlined"
            onClick={() => setIsEditMode(false)}
          >
            Cancel
          </Button>}
        </Box>
      </Box>}

      {!isEditMode && employee && <Box mt={3}>
        <List>
          <ListItemText
            primary={`${employee.firstName} ${employee.lastName}`}
            sx={{ flex: `0 0 200px` }}
          />

          <ListItemText
            primary={employee.email}
            sx={{ flex: `0 0 200px` }}
          />

          <ListItemText
            primary={employee.phone}
            sx={{ flex: `0 0 200px` }}
          />

          <ListItemButton
            sx={{ padding: `0` }}
            onClick={() => {
              setIsEditMode(true);
            }}
          >
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
          </ListItemButton>
        </List>
      </Box>}

      {employee && <Box mt={3}>
        <EmployeeAvailability employeeId={employee.employeeId} />
      </Box>}
    </Box>
  );
}
