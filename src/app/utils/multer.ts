// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, process.cwd() + "/uploads/");
//   },
//   filename: function (req, file, cb) {
//     return cb(
//       null,
//       `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
//     );
//   },
// });

// export const upload = multer({ storage: storage });


import multer from "multer";

// Configure multer to store files in memory (instead of disk storage)
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });
