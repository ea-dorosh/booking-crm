import { AddCircle } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Button,
  LinearProgress,
  Typography,
} from "@mui/material";
import {
  useState,
  useEffect,
} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import CompanyBranchesContainer from "@/components/CompanyBranchesContainer/CompanyBranchesContainer";
import CompanyDetails from "@/components/CompanyDetails/CompanyDetails";
import CompanyForm from "@/components/CompanyForm/CompanyForm";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  fetchCompany,
  updateCompany,
  resetCompanyData,
  resetError,
  cleanError,
  cleanErrors,
} from "@/features/company/companySlice";

export default function CompanyDetailPage() {
  const [hasCreateButton, setHasCreateButton] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    data: company, isPending, updateFormPending, error, 
  } = useSelector(state => state.company);

  const formErrors = useSelector(state => state.company.updateFormErrors);

  useEffect(() => {
    dispatch(fetchCompany());

    return () => {
      dispatch(resetCompanyData());
    };
  }, []);

  useEffect(() => {
    if (error && !isPending && !company) {
      dispatch(resetError());
      setHasCreateButton(true);
    }
  }, [company, isPending]);

  const updateHandler = async (company) => {
    try {
      const response = await dispatch(updateCompany(company)).unwrap();

      dispatch(cleanErrors());
      setIsEditMode(false);

      dispatch(fetchCompany(response.data));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCleanError = (fieldName) => {
    dispatch(cleanError(fieldName));
  };

  const handleCleanErrors = () => {
    dispatch(cleanErrors());
  };

  return (
    <PageContainer
      pageTitle={company ?
        `${company.name}`: `New Company`
      }
    >
      {!isEditMode && <GoBackNavigation />}

      {isPending && <Box
        mt={2}>
        <LinearProgress />
      </Box>}

      {hasCreateButton && !isEditMode &&<Box
        onClick={() => {
          dispatch(cleanErrors());
          setIsEditMode(true);
        }}
        sx={{
          display: `flex`,
          alignItems: `center`,
          marginTop: `20px`,
          marginLeft: `auto`,
          backgroundColor: `#1976d2`,
          width: `fit-content`,
          padding: `10px 20px 10px 30px`,
          borderRadius: `50px`,
        }}
      >
        <Typography
          variant="button"
          sx={{ color: `#fff` }}
        >
          add company
        </Typography>

        <IconButton
          sx={{ color: `#fff` }}
        >
          <AddCircle />
        </IconButton>
      </Box>}

      {isEditMode && <Box
        mt={3}>
        <CompanyForm
          company={company}
          submitForm={updateHandler}
          formErrors={formErrors?.validationErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
          isPending={updateFormPending}
        />

        <Box
          mt={2}
          sx={{ width:`100%` }}>
          {<Button
            variant="outlined"
            onClick={() => {
              dispatch(cleanErrors());

              if (hasCreateButton) {
                navigate(`/company`, { replace: true });
              } else {
                setIsEditMode(false)
              }
            }
            }
            sx={{ width:`100%` }}
            disabled={updateFormPending}
          >
            Cancel
          </Button>}
        </Box>
      </Box>}

      {!isEditMode && company && <Box
        mt={3}>
        <CompanyDetails
          company={company}
          onChangeCompanyClick={() => {
            dispatch(cleanErrors());
            setIsEditMode(true);
          }}
        />
      </Box>}

      <CompanyBranchesContainer
        branches={company?.branches || []}
      />
    </PageContainer>
  );
}
