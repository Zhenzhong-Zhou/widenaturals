const validateImage = (req, res, next) => {
    const {file} = req;
    if (!file) {
        return res.status(400).json({message: 'No file uploaded'});
    }
    
    const filetypes = /jpeg|jpg|png|gif|webp|bmp/;
    const extname = filetypes.test(file.mimetype.toLowerCase());
    
    if (!extname) {
        return res.status(400).json({message: 'Invalid file type. Only images are allowed.'});
    }
    
    next();
};

module.exports = validateImage;