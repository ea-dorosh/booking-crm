import { Edit } from "@mui/icons-material";
import { 
  Button, 
  Typography,
  Box,
  Divider,
  List,
  ListItemText
} from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from "react-router-dom";
import EmployeeAvailability from "@/components/EmployeeAvailability/EmployeeAvailability";
import EmployeeForm from "@/components/EmployeeForm/EmployeeForm";
import PageContainer from '@/components/PageContainer/PageContainer';
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
  }, []);

  useEffect(() => {
    (async () => {
      if (updateFormStatus === `succeeded`) {
        await dispatch(fetchEmployees());
        setIsEditMode(false);
        dispatch(resetUpdateFormStatus());

        if (newEmployeeId) {
          navigate(`/employees/${newEmployeeId}`);
        }
      }
    })();
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
    <PageContainer 
      pageTitle={employee ? 
        `${employee.lastName} ${employee.firstName}` 
        :
        `New employee`
      }
      hideSideNav
    >
      <Link to={`/employees`}>Go back</Link>

      <Divider />

      {isEditMode && <Box mt={3}>
        <EmployeeForm
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

      {!isEditMode && employee && <Box mt={3}
        sx={{
          display: `flex`,
        }}
      >
        <List   sx={{
          width: `60%`
        }}>
          <ListItemText
            primary={`${employee.firstName} ${employee.lastName}`}
            secondary="Name"
            sx={{ 
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={employee.email}
            secondary="Email"
            sx={{ 
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={employee.phone}
            secondary="Phone"
            sx={{ 
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />
        </List>

        <Box sx={{width: `40%`}}>
          <img 
            src={employee.image} 
            alt={`${employee.firstName} ${employee.lastName}`}
            style={{ width: `100%` }}
          />
        </Box>
      </Box>}

      {!isEditMode && <Button
        sx={{ width: `100%`, mt: `20px` }}
        onClick={() => {
          setIsEditMode(true);
        }}
        startIcon={<Edit />}
        variant="outlined"
      >
        Update Employee
      </Button>}
      

      {employee && <Box mt={2.5}>
        <Typography variant="h6">
          Availability
        </Typography>

        <EmployeeAvailability employeeId={employee.employeeId} />
      </Box>}
    </PageContainer>
  );
}
