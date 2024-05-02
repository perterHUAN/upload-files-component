import express from "express";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "dest/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const extensionStartPosition = file.originalname.lastIndexOf(".");
//     const fileExtension = file.originalname.slice(extensionStartPosition);
//     const fileName = file.originalname.slice(0, extensionStartPosition);
//     cb(null, fileName + "-" + uniqueSuffix + fileExtension);
//   },
// });

// const upload = multer({ storage: storage, preservePath: true });

const upload = multer({ dest: "dest/" });

const app = express();
app.use(express.static("public"));
app.use(morgan("tiny"));
app.use(cors());

app.post("/upload-file", upload.any(), (req, res) => {
  res.send({ message: "upload successful!" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
