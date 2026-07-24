const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, //10MB
  },

  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".xlsx", ".xls", ".csv"];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error(
          "Only .xlsx, .xls and .csv files are allowed."
        )
      );
    }

    cb(null, true);
  },
});

module.exports = upload;