const multer = require("multer");
const path = require("node:path");
const crypto = require("node:crypto");

const tempDir = path.join(__dirname, "..", "temp");

const multerConfig = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extname);
    const id = crypto.randomUUID();
    cb(null, `${basename}-${id}${extname}`);
  },
});

const upload = multer({
  storage: multerConfig,
});

module.exports = upload;
