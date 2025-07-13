import {
  Box,
} from "@mui/material";
import { useState } from "react";

const ImageUpload = ({
  name,
  onChange,
  currentImage,
  disabled = false,
  sx = {},
}) => {
  const [temporaryImage, setTemporaryImage] = useState(null);

  const handleImgChange = (event) => {
    const [file] = event.target.files;
    if (file) {
      setTemporaryImage(URL.createObjectURL(file));
    }

    onChange(event);
  };

  const hasImage = temporaryImage || currentImage;

  return (
    <Box sx={{ width: `100%`, ...sx }}>
      {hasImage && (
        <Box
          sx={{
            padding: `20px`,
            margin: `20px 0`,
            width: `100%`,
            backgroundColor: `#f5f5f5`,
            display: `flex`,
            justifyContent: `center`,
            alignItems: `center`,
          }}
        >
          <img
            src={temporaryImage || currentImage}
            style={{
              width: `60%`,
              margin: `0 auto`,
              maxHeight: `200px`,
              objectFit: `contain`,
            }}
            alt="Preview"
          />
        </Box>
      )}

      <input
        accept="image/*"
        type="file"
        name={name}
        onChange={handleImgChange}
        disabled={disabled}
        style={{
          margin: `20px 0`,
          width: `100%`,
        }}
      />
    </Box>
  );
};

export default ImageUpload;