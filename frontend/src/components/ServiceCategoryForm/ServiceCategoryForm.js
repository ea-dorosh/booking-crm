import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import { useState, useEffect } from "react";

export default function ServiceCategoryForm({
  category,
  createNewCategory,
  formErrors,
  cleanError,
  cleanErrors,
}) {
  const isEditMode = Boolean(category);  

  const [formData, setFormData] = useState({
    name: isEditMode ? category.name : ``,
    id: isEditMode ? category.id : ``,
    image: null,
  });

  const [temporaryImage, setTemporaryImage] = useState(null);

  useEffect(() => {
    return () => cleanErrors()
  }, []);

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

  const handleImgChange = (event) => {
    const [file] = event.target.files
    if (file) {
      setTemporaryImage(URL.createObjectURL(file))
    }

    setFormData((prevData) => ({
      ...prevData,
      image: event.target.files[0],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await createNewCategory({
      ...category,
      ...formData,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FormControl error={Boolean(formErrors?.name)}>
        <TextField
          value={formData.name}
          label="Service Category Name"
          variant="outlined"
          name="name"
          onChange={handleChange}
        />
        {formErrors?.name && 
          <FormHelperText>
            {formErrors.name}
          </FormHelperText>
        }
      </FormControl>
      {(temporaryImage || category?.image) && 
        <Box 
          sx={{
            padding: `20px`, 
            margin: `20px 0`, 
            width: `100%`,
            backgroundColor: `#f5f5f5`,
          }}
        >
          {temporaryImage && 
            <img 
              src={temporaryImage}
              style={{ width: `100%` }}
            />
          }

          {!temporaryImage && category?.image && 
            <img 
              src={category.image} 
              style={{ width: `100%` }}
            />
          }
        </Box>}

      <input
        accept="image/*"
        type='file'
        onChange={handleImgChange}
        style={{ margin: `20px 0`}}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: `20px` }}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      >
        Save
      </Button>
    </Box>
  );
}
