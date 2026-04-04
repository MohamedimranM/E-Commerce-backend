import multer from 'multer';

const storage = multer.diskStorage({}); // Use default tmp folder
const upload = multer({ storage });

export default upload;
